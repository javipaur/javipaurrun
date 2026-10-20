import { scrapeFromLasterketak } from "../src/lib/scraping";
async function main(){ const r=await scrapeFromLasterketak(); console.log("Lasterketak", r.length); }
main().catch(e=>{console.error(e); process.exit(1);});
