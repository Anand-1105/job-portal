"""
LinkedIn & External "Tag-Team" Hybrid Agent v4.0 - Master Build.
Features: 5-second manual-idle watchdog, external site support, and multi-page form filling.
"""
import os
import sys
import json
import asyncio
import subprocess
import tempfile
import traceback
import re
from dotenv import load_dotenv

load_dotenv()

def log_debug(msg):
    with open("bot_debug.log", "a", encoding="utf-8") as f:
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{timestamp}] {msg}\n")

log_debug("Agent Module Loaded (v4.0 Hybrid)")

LINKEDIN_EMAIL = os.environ.get("LINKEDIN_EMAIL", "")
LINKEDIN_PASSWORD = os.environ.get("LINKEDIN_PASSWORD", "")

# This script runs in the subprocess
PLAYWRIGHT_SCRIPT = '''
import sys, json, time, re
from playwright.sync_api import sync_playwright

args = json.loads(sys.argv[1])
job_url = args["job_url"]
email = args["email"]
password = args["password"]
phone = args["phone"]

def ask_brain(question):
    print(f"QUESTION: {question}", flush=True)
    line = sys.stdin.readline()
    try:
        data = json.loads(line)
        return data.get("answer", "Yes")
    except:
        return "Yes"

def wait_for_manual_idle(locator, timeout=5):
    """
    Waits for 5 seconds for human input. If the field is modified or already filled,
    returns False (meaning human took over). If stays empty for 5s, returns True (takeover).
    """
    initial_val = locator.input_value().strip()
    if initial_val: return False # Human already filled it
    
    print(f"LOG: Watching field for 5s manual input...", flush=True)
    for _ in range(int(timeout * 2)):
        time.sleep(0.5)
        current_val = locator.input_value().strip()
        if current_val != initial_val:
            print("LOG: Human detected! Waiting for you to finish...", flush=True)
            return False # Human is typing
    
    return True # 5s passed, still empty. Bot takes over.

def run():
    with sync_playwright() as p:
        print("LOG: Launching Hybrid Agent window...", flush=True)
        # Headless=False is mandatory for Tag-Team mode
        browser = p.chromium.launch(headless=False, slow_mo=300, args=["--start-maximized"])
        try:
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            context.set_default_timeout(60000)
            page = context.new_page()

            # Handle New Tabs (for External Apply)
            def on_page(new_p):
                print("LOG: NEW TAB DETECTED! Switching vision...", flush=True)
                new_p.wait_for_load_state("domcontentloaded")
                handle_form_filling(new_p)

            context.on("page", on_page)

            print(f"LOG: Navigating to LinkedIn...", flush=True)
            page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
            
            if page.locator("#username").is_visible():
                print(f"LOG: Log-in required. Please ensure credentials are correct.", flush=True)
                page.fill("#username", email)
                page.fill("#password", password)
                page.click('[type="submit"]')
                page.wait_for_load_state("load")
            
            time.sleep(3)

            print(f"LOG: Reaching Job URL: {job_url}", flush=True)
            page.goto(job_url, wait_until="domcontentloaded")
            time.sleep(3)
            
            # Simple Scroll
            page.mouse.wheel(0, 500)
            time.sleep(2)

            print("LOG: Hunting for Apply button...", flush=True)
            # Expanded selectors for External and Easy Apply
            btn_selectors = [
                "button.jobs-apply-button", 
                "button:has-text('Easy Apply')", 
                "button:has-text('Apply')",
                "a:has-text('Apply')",
                "[data-control-name='jobdetails_topcard_apply']"
            ]
            
            apply_btn = None
            for sel in btn_selectors:
                try:
                    target = page.locator(sel).first
                    if target.is_visible():
                        apply_btn = target
                        break
                except: continue
            
            if not apply_btn:
                print(json.dumps({"success": False, "message": "Could not find any Apply button."}), flush=True)
                return

            print(f"LOG: Clicking {apply_btn.inner_text().strip()} button...", flush=True)
            apply_btn.click()
            time.sleep(5) # Wait for redirect or modal

            # Check if we stayed on page (Easy Apply) or new focus is needed (handled by context.on("page"))
            handle_form_filling(page)

        except Exception as e:
            print(json.dumps({"success": False, "message": f"Global Automation Error: {str(e)}"}), flush=True)
        finally:
            print("LOG: Application window closing in 10s. You can finish manually if needed.", flush=True)
            time.sleep(10)
            browser.close()

def handle_form_filling(target_page):
    print("LOG: Form Solver Engine active. I will fill fields after 5s of idle time.", flush=True)
    
    for step in range(20): # More steps for complex portals
        print(f"LOG: Analyzing Page/Step {step+1}...", flush=True)
        time.sleep(2)

        # Look for the application container or the whole body
        container = target_page.locator(".jobs-easy-apply-content, .jobs-easy-apply-modal, main, body").first
        
        # Scroll container to load dynamic fields
        try:
            container.evaluate("el => el.scrollTop = el.scrollHeight")
            time.sleep(1)
            container.evaluate("el => el.scrollTop = 0")
        except: pass

        # 1. Fill Text Inputs & Textareas
        inputs = target_page.locator("input[type='text'], input[type='tel'], textarea, input[type='email']").all()
        for i in inputs:
            if not i.is_visible() or i.input_value().strip(): continue
            i.scroll_into_view_if_needed()
            
            # Watchdog: Wait 5s for human input
            if not wait_for_manual_idle(i, timeout=5):
                continue # Human intervened, skip this field for now

            id_val = i.get_attribute('id')
            label_el = target_page.locator(f"label[for='{id_val}']").first if id_val else None
            label_text = label_el.inner_text() if (label_el and label_el.count()) else i.get_attribute("placeholder") or "field"
            
            # Priority: Phone check
            if any(k in label_text.lower() for k in ["phone", "mobile", "contact", "number"]):
                print(f"LOG: Auto-filling Phone...", flush=True)
                i.fill(str(phone))
            else:
                ans = ask_brain(label_text)
                i.fill(str(ans))

        # 2. Handle Select Dropdowns
        selects = target_page.locator("select").all()
        for s in selects:
            if not s.is_visible() or s.input_value().strip(): continue
            s.scroll_into_view_if_needed()
            id_val = s.get_attribute('id')
            label_el = target_page.locator(f"label[for='{id_val}']").first if id_val else None
            label_text = label_el.inner_text() if (label_el and label_el.count()) else "Option"
            
            ans = ask_brain(label_text)
            try: s.select_option(label=ans)
            except: pass

        # 3. Handle Radio Buttons / Fieldsets
        fieldsets = target_page.locator("fieldset").all()
        for fs in fieldsets:
            legend = fs.locator("legend").first
            legend_text = legend.inner_text() if legend.count() else "Option"
            
            # Check if already has a selected option
            if fs.locator("input:checked").count() > 0: continue
            
            ans = ask_brain(legend_text)
            target = fs.locator(f"label:has-text('{ans}')").first
            if target.count(): 
                target.scroll_into_view_if_needed()
                target.click()

        # 4. Search for Navigation Buttons
        submit_btn = target_page.locator("button:has-text('Submit'), button:has-text('Finish')").first
        if submit_btn.is_visible():
            print("LOG: Submit button ready! Clicking in 3s unless you stop me...", flush=True)
            time.sleep(3)
            submit_btn.scroll_into_view_if_needed()
            submit_btn.click()
            time.sleep(5)
            print(json.dumps({"success": True, "message": "Application submitted by Tag-Team AI!"}), flush=True)
            return

        next_btn = target_page.locator("button:has-text('Review'), button:has-text('Next'), button:has-text('Continue'), button:has-text('Next step')").first
        if next_btn.is_visible():
            print(f"LOG: Moving to next step...", flush=True)
            next_btn.scroll_into_view_if_needed()
            next_btn.click()
            time.sleep(3)
        else:
            print("LOG: No obvious Next/Submit buttons found. Waiting for you to navigate or finish...", flush=True)
            time.sleep(10)
            # If no change in URL or Page content after 10s, we might be stuck
            break

run()
'''

async def auto_apply_linkedin(
    job_url: str,
    candidate_name: str,
    candidate_email: str,
    candidate_phone: str,
    resume_text: str,
    cover_letter: str = ""
) -> dict:
    from chains.form_solver import solve_form_question
    if not LINKEDIN_EMAIL or not LINKEDIN_PASSWORD:
        return {"success": False, "message": "LinkedIn credentials missing"}

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(PLAYWRIGHT_SCRIPT)
        script_path = f.name

    args_json = json.dumps({
        "job_url": job_url,
        "email": LINKEDIN_EMAIL,
        "password": LINKEDIN_PASSWORD,
        "phone": candidate_phone
    })

    log_debug(f"Starting LinkedIn Tag-Team (v4.0 Hybrid) for URL: {job_url}")
    main_loop = asyncio.get_running_loop()

    def run_agent_sync():
        import subprocess
        import threading

        final_resp = {"success": False, "message": "Bot initialization timed out (v4.0)."}
        
        proc = subprocess.Popen(
            [sys.executable, script_path, args_json],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            creationflags=0x00000010 if sys.platform == "win32" else 0
        )

        def log_stderr():
            for line in iter(proc.stderr.readline, ''):
                log_debug(f"[TAG-TEAM-ERR] {line.strip()}")

        threading.Thread(target=log_stderr, daemon=True).start()

        try:
            for line in iter(proc.stdout.readline, ''):
                text = line.strip()
                if not text: continue
                
                if text.startswith("QUESTION:"):
                    question = text.replace("QUESTION:", "").strip()
                    log_debug(f"Question: {question}")
                    future = asyncio.run_coroutine_threadsafe(
                        solve_form_question(question, resume_text, candidate_name), main_loop
                    )
                    result = future.result(timeout=60)
                    proc.stdin.write(json.dumps(result) + "\n")
                    proc.stdin.flush()
                elif text.startswith("LOG:"):
                    log_debug(f"Log: {text}")
                    print(f"[Tag-Team] {text}")
                elif text.startswith("{"):
                    try:
                        data = json.loads(text)
                        if "success" in data:
                            final_resp = data
                    except: pass
        except Exception as e:
            log_debug(f"Comm error: {str(e)}")

        try: proc.wait(timeout=30)
        except: proc.kill()
            
        return final_resp

    try:
        return await asyncio.to_thread(run_agent_sync)
    except Exception:
        err_detail = traceback.format_exc()
        log_debug(f"Tag-Team Crash (v4.0):\n{err_detail}")
        return {"success": False, "message": f"Hybrid build crash: {err_detail[:100]}"}
    finally:
        try: os.unlink(script_path)
        except: pass
