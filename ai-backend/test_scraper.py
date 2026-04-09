import asyncio, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from services.linkedin_scraper import scrape_linkedin_jobs

async def test():
    jobs = await scrape_linkedin_jobs('software engineer', 'India', limit=5)
    print('Scraped', len(jobs), 'jobs')
    for j in jobs[:3]:
        print(' -', j['title'], '|', j['location'], '|', j['type'])

asyncio.run(test())
