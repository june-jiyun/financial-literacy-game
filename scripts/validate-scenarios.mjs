import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenariosDir = join(__dirname, '..', 'data', 'scenarios');

const EPSILON = 0.001;
const VALID_INDICATORS = ['revenue', 'operating_profit', 'debt_ratio', 'per', 'net_buying'];

let errors = 0;
let checked = 0;

function err(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

let files;
try {
  files = readdirSync(scenariosDir).filter(f => f.endsWith('.json')).sort();
} catch (e) {
  console.error(`Cannot read scenarios directory: ${e.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error('No scenario JSON files found in data/scenarios/');
  process.exit(1);
}

for (const file of files) {
  const filePath = join(scenariosDir, file);
  console.log(`\nChecking ${file}...`);

  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(`Invalid JSON: ${e.message}`);
    continue;
  }

  const { scenario_set_id, turns, initial_cashflow } = data;

  if (!scenario_set_id) err('Missing scenario_set_id');
  if (!initial_cashflow) err('Missing initial_cashflow');

  if (!Array.isArray(turns)) {
    err('turns must be an array');
    continue;
  }

  if (turns.length < 3 || turns.length > 5) {
    err(`turns count must be 3–5, got ${turns.length}`);
  }

  for (const turn of turns) {
    const { turn_index, companies } = turn;

    if (!Array.isArray(companies) || companies.length !== 3) {
      err(`Turn ${turn_index}: must have exactly 3 companies, got ${companies?.length}`);
      continue;
    }

    for (const company of companies) {
      const { id, cause_cards, price_change_rate, correct_cause_id, indicators } = company;
      const loc = `Turn ${turn_index}, company "${id}"`;
      checked++;

      if (!indicators) {
        err(`${loc}: missing indicators`);
      } else {
        for (const ind of VALID_INDICATORS) {
          if (!(ind in indicators)) err(`${loc}: missing indicator "${ind}"`);
        }
      }

      if (!Array.isArray(cause_cards) || cause_cards.length < 1) {
        err(`${loc}: cause_cards must have at least 1 element`);
        continue;
      }

      for (const card of cause_cards) {
        if (!card.id) err(`${loc}: cause card missing id`);
        if (!card.label) err(`${loc}: cause card ${card.id} missing label`);
        if (typeof card.impact_ticks !== 'number') {
          err(`${loc}: cause card ${card.id} impact_ticks must be a number`);
        }
        if (!VALID_INDICATORS.includes(card.linked_indicator)) {
          err(`${loc}: cause card ${card.id} has invalid linked_indicator "${card.linked_indicator}"`);
        }
      }

      const sum = cause_cards.reduce((acc, c) => acc + (c.impact_ticks || 0), 0);
      if (Math.abs(sum - price_change_rate) > EPSILON) {
        err(`${loc}: sum of impact_ticks (${sum.toFixed(4)}) ≠ price_change_rate (${price_change_rate})`);
      }

      const absValues = cause_cards.map(c => Math.abs(c.impact_ticks || 0));
      const maxAbs = Math.max(...absValues);
      const maxCount = absValues.filter(v => Math.abs(v - maxAbs) <= EPSILON).length;
      if (maxCount !== 1) {
        err(`${loc}: max |impact_ticks| (${maxAbs}) is not unique — ${maxCount} cards tied`);
      }

      if (!correct_cause_id) {
        err(`${loc}: missing correct_cause_id`);
      } else {
        const correctCard = cause_cards.find(c => c.id === correct_cause_id);
        if (!correctCard) {
          err(`${loc}: correct_cause_id "${correct_cause_id}" not found in cause_cards`);
        } else if (Math.abs(Math.abs(correctCard.impact_ticks) - maxAbs) > EPSILON) {
          err(
            `${loc}: correct_cause_id "${correct_cause_id}" does not have max |impact_ticks| ` +
            `(${Math.abs(correctCard.impact_ticks)} vs max ${maxAbs})`
          );
        }
      }
    }
  }
}

console.log(`\n${'─'.repeat(60)}`);
if (errors === 0) {
  console.log(
    `✓ All ${files.length} scenario file(s) passed validation` +
    ` (${checked} company-turns checked)`
  );
} else {
  console.error(`✗ Validation failed: ${errors} error(s) across ${files.length} file(s)`);
  process.exit(1);
}
