import {
  scrapeFromLasterketak,
  scrapeFromRockTheSport,
  scrapeFromSportmaniacs,
} from "../src/lib/scraping";

type Scraper = () => Promise<unknown[]>;

async function withTimeout(name: string, run: Scraper, ms: number) {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${name} superó ${ms}ms`)), ms)
  );
  return Promise.race([run(), timeout]);
}

async function main() {
  const sources: Array<{ name: string; run: Scraper }> = [
    { name: "Lasterketak", run: scrapeFromLasterketak },
    { name: "RockTheSport", run: scrapeFromRockTheSport },
    { name: "Sportmaniacs", run: scrapeFromSportmaniacs },
  ];

  for (const source of sources) {
    try {
      const races = await withTimeout(source.name, source.run, 30000);
      console.log(`${source.name}: ${races.length} carreras`);
      if (races.length === 0) {
        console.warn(`${source.name}: devolvió 0 carreras (puede ser temporal)`);
      }
    } catch (error) {
      console.error(`${source.name}: fallo ->`, error instanceof Error ? error.message : error);
    }
  }

  console.log("Smoke fuentes secundarias: finalizado");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
