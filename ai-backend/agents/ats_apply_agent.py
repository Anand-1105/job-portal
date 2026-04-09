"""
ATS Apply Agent — orchestrates async auto-apply across multiple ATS platforms.
Runs Playwright in a subprocess to avoid Windows asyncio conflicts.
"""
import os, sys, json, asyncio, tempfile
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────
# Playwright scripts per ATS (run in subprocess)
# ──────────────────────────────────────────────

GREENHOUSE_SCRIPT = '''
import sys, json, time
from playwright.sync_api import sync_playwright

args = json.loads(sys.argv[1])
url = args["url"]
c = args["candidate"]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=400)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            print("LOG: Opening Greenhouse application form...")
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)

            # Standard Greenhouse fields
            for selector, value in [
                ("#first_name", c.get("first_name", "")),
                ("#last_name", c.get("last_name", "")),
                ("#email", c.get("email", "")),
                ("#phone", c.get("phone", "")),
            ]:
                el = page.locator(selector).first
                if el.count() and value:
                    el.fill(value)

            # Resume as text paste (if supported)
            resume_box = page.locator("textarea[id*='resume'], textarea[name*='resume']").first
            if resume_box.count() and c.get("resume_text"):
                resume_box.fill(c["resume_text"])

            # Cover letter
            cover_box = page.locator("textarea[id*='cover'], textarea[name*='cover_letter']").first
            if cover_box.count() and c.get("cover_letter"):
                cover_box.fill(c["cover_letter"])

            # Handle custom questions
            questions = page.locator("label.application-label").all()
            for q in questions:
                q_text = q.inner_text()
                print(f"QUESTION: {q_text}")
                ans_line = sys.stdin.readline()
                try:
                    ans = json.loads(ans_line).get("answer", "")
                except:
                    ans = ""
                # Find associated input
                for_id = q.get_attribute("for")
                if for_id:
                    inp = page.locator(f"#{for_id}").first
                    if inp.count():
                        tag = inp.evaluate("el => el.tagName.toLowerCase()")
                        if tag in ("input", "textarea"):
                            inp.fill(str(ans))

            # Submit
            submit = page.locator("button[type='submit'], input[type='submit']").last
            if submit.count() and submit.is_visible():
                print("LOG: Submitting application...")
                submit.click()
                time.sleep(3)
                print(json.dumps({"success": True, "message": "Applied via Greenhouse!"}))
            else:
                print(json.dumps({"success": False, "message": "Could not find submit button on Greenhouse form."}))
        except Exception as e:
            print(json.dumps({"success": False, "message": f"Greenhouse error: {str(e) or 'Unknown error'}"}))
        finally:
            time.sleep(4)
run()
'''

LEVER_SCRIPT = '''
import sys, json, time
from playwright.sync_api import sync_playwright

args = json.loads(sys.argv[1])
url = args["url"]
c = args["candidate"]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=400)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            print("LOG: Opening Lever application form...")
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)

            for selector, value in [
                ("input[name='name']", c.get("full_name", "")),
                ("input[name='email']", c.get("email", "")),
                ("input[name='phone']", c.get("phone", "")),
                ("input[name='org']", c.get("current_company", "")),
                ("input[name='urls[LinkedIn]']", c.get("linkedin_url", "")),
            ]:
                el = page.locator(selector).first
                if el.count() and value:
                    el.fill(value)

            # Cover letter / comments
            cover = page.locator("textarea[name='comments']").first
            if cover.count() and c.get("cover_letter"):
                cover.fill(c["cover_letter"])

            # Custom questions
            question_divs = page.locator(".application-question").all()
            for qd in question_divs:
                label = qd.locator("label").first
                q_text = label.inner_text() if label.count() else ""
                if not q_text: continue
                print(f"QUESTION: {q_text}")
                ans_line = sys.stdin.readline()
                try:
                    ans = json.loads(ans_line).get("answer", "Yes")
                except:
                    ans = "Yes"

                inp = qd.locator("input[type='text'], textarea, select").first
                if inp.count():
                    tag = inp.evaluate("el => el.tagName.toLowerCase()")
                    if tag == "select":
                        try: inp.select_option(label=ans)
                        except: pass
                    else:
                        inp.fill(str(ans))

            # Submit
            submit = page.locator("button.template-btn-submit").first
            if submit.count() and submit.is_visible():
                print("LOG: Submitting application...")
                submit.click()
                time.sleep(3)
                print(json.dumps({"success": True, "message": "Applied via Lever!"}))
            else:
                print(json.dumps({"success": False, "message": "Could not find submit button on Lever form."}))
        except Exception as e:
            print(json.dumps({"success": False, "message": f"Lever error: {str(e) or 'Unknown error'}"}))
        finally:
            time.sleep(4)
run()
'''

GENERIC_SCRIPT = '''
import sys, json, time
from playwright.sync_api import sync_playwright

args = json.loads(sys.argv[1])
url = args["url"]
c = args["candidate"]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            print(f"LOG: Opening generic application form: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)

            # Try common name/email/phone patterns
            for sel, val in [
                ("input[name*='name'][type='text'], input[id*='name'][type='text']", c.get("full_name", "")),
                ("input[type='email']", c.get("email", "")),
                ("input[type='tel'], input[name*='phone']", c.get("phone", "")),
            ]:
                el = page.locator(sel).first
                if el.count() and el.is_visible() and val:
                    el.fill(val)

            # All remaining empty visible inputs — ask AI
            inputs = page.locator("input[type='text']:visible, textarea:visible").all()
            for i in inputs:
                if i.input_value(): continue
                label = page.locator(f"label[for='{i.get_attribute(\"id\")}']").first
                q_text = label.inner_text() if label.count() else i.get_attribute("placeholder") or "Unknown field"
                print(f"QUESTION: {q_text}")
                ans_line = sys.stdin.readline()
                try:
                    ans = json.loads(ans_line).get("answer", "")
                except:
                    ans = ""
                if ans: i.fill(str(ans))

            submit = page.locator("button[type='submit'], input[type='submit']").last
            if submit.count() and submit.is_visible():
                print("LOG: Submitting application...")
                submit.click()
                time.sleep(3)
                print(json.dumps({"success": True, "message": "Applied via company careers page!"}))
            else:
                print(json.dumps({"success": False, "message": "Submit button not found — manual review needed."}))
        except Exception as e:
            print(json.dumps({"success": False, "message": f"Generic error: {str(e) or 'Unknown error'}"}))
        finally:
            time.sleep(4)
run()
'''

ATS_SCRIPTS = {
    "greenhouse": GREENHOUSE_SCRIPT,
    "lever": LEVER_SCRIPT,
    "ashby": GREENHOUSE_SCRIPT,   # Ashby has very similar structure to Greenhouse
    "smartrecruiters": GENERIC_SCRIPT,
    "workday": GENERIC_SCRIPT,
    "generic": GENERIC_SCRIPT,
}


async def _run_ats_script(script: str, url: str, candidate: dict, resume_text: str, candidate_name: str) -> dict:
    """Spawns the ATS playwright script and bridges question-answering via stdin/stdout."""
    from chains.form_solver import solve_form_question

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(script)
        script_path = f.name

    args_json = json.dumps({"url": url, "candidate": candidate})

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, script_path, args_json,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            # NOTE: Do NOT use CREATE_NEW_CONSOLE (0x00000010) here — it hijacks
            # stdin/stdout pipes on Windows. Chromium opens its own visible window.
        )

        final_response = {"success": False, "message": "Agent failed to produce output"}

        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            text = line.decode().strip()

            if text.startswith("QUESTION:"):
                question = text.replace("QUESTION:", "").strip()
                print(f"[Brain] Thinking: {question}")
                result = await solve_form_question(question, resume_text, candidate_name)
                proc.stdin.write((json.dumps(result) + "\n").encode())
                await proc.stdin.drain()
            elif text.startswith("LOG:"):
                print(f"[ATS-Agent] {text}")
            elif text.startswith("{"):
                final_response = json.loads(text)
            else:
                print(f"[ATS-Raw] {text}")

        await proc.wait()

        # Capture any stderr for debugging
        if proc.returncode != 0:
            try:
                err_bytes = await asyncio.wait_for(proc.stderr.read(), timeout=2)
                err_text = err_bytes.decode().strip()
                if err_text:
                    print(f"[ATS-Agent-STDERR] {err_text[:500]}")
                    if final_response["message"] == "Agent failed to produce output":
                        final_response["message"] = err_text[:200]
            except:
                pass

        return final_response

    except Exception as e:
        return {"success": False, "message": str(e) or "Unknown error in ATS agent"}
    finally:
        try:
            os.unlink(script_path)
        except:
            pass


async def auto_apply_ats(
    job_url: str,
    job_title: str,
    company_name: str,
    candidate_name: str,
    candidate_email: str,
    candidate_phone: str,
    resume_text: str,
    cover_letter: str = "",
    task_id: str = None
) -> dict:
    from services.job_url_finder import find_ats_url, detect_ats, parse_company_from_job_title
    from services.task_store import update_task

    def _update(status, msg):
        print(f"[AutoApply] {msg}")
        if task_id:
            update_task(task_id, status, msg)

    # Step 1: Determine the company name
    if not company_name:
        company_name = parse_company_from_job_title(job_title)

    # Step 2: Check if source_url is already a direct ATS link
    ats_type = detect_ats(job_url)
    apply_url = job_url

    if ats_type == "generic" and "linkedin.com" in job_url:
        # Source is LinkedIn — need to find the real ATS URL
        _update("finding_url", f"🔍 Searching for {company_name}'s careers page...")
        found = await find_ats_url(company_name, job_title)
        if found:
            apply_url = found["url"]
            ats_type = found["ats_type"]
            _update("found_url", f"✅ Found {ats_type.title()} application: {apply_url}")
        else:
            # Fall back to generic — open the LinkedIn URL but use generic filler
            _update("fallback", "⚠️ Using LinkedIn URL with generic form filler")
            ats_type = "generic"

    script = ATS_SCRIPTS.get(ats_type, GENERIC_SCRIPT)

    candidate = {
        "full_name": candidate_name,
        "first_name": candidate_name.split()[0] if candidate_name else "",
        "last_name": " ".join(candidate_name.split()[1:]) if candidate_name else "",
        "email": candidate_email,
        "phone": candidate_phone,
        "cover_letter": cover_letter,
        "resume_text": resume_text,
    }

    _update("filling_form", f"📝 Filling {ats_type.title()} application form...")
    result = await _run_ats_script(script, apply_url, candidate, resume_text, candidate_name)

    if result["success"]:
        _update("success", f"✅ {result['message']}")
    else:
        _update("failed", f"❌ {result['message']}")

    return {**result, "ats_type": ats_type, "apply_url": apply_url}
