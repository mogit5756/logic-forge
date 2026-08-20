import { FullAdderCircuit, FullSubtractorCircuit, buildRippleCarryAdder } from './src/features/arithmetic/predefinedCircuits.js';
import { evaluateCircuitAllNodes } from './src/engine/simulator/simulator.js';

console.log("Testing Full Adder");
for (let a=0; a<=1; a++) {
  for (let b=0; b<=1; b++) {
    for (let c=0; c<=1; c++) {
       const res = evaluateCircuitAllNodes(FullAdderCircuit, { A: a, B: b, Cin: c });
       console.log(`A=${a} B=${b} Cin=${c} | Sum=${res['SUM']} Cout=${res['COUT']}`);
    }
  }
}

console.log("\nTesting Full Subtractor");
for (let a=0; a<=1; a++) {
  for (let b=0; b<=1; b++) {
    for (let c=0; c<=1; c++) {
       const res = evaluateCircuitAllNodes(FullSubtractorCircuit, { A: a, B: b, Bin: c });
       console.log(`A=${a} B=${b} Bin=${c} | Diff=${res['DIFF']} Bout=${res['BOUT']}`);
    }
  }
}

console.log("\nTesting 4-bit RCA");
const rca = buildRippleCarryAdder(4);
const res1 = evaluateCircuitAllNodes(rca, { A0:1, A1:1, A2:1, A3:1, B0:1, B1:0, B2:0, B3:0, Cin:0 });
console.log(`15 + 1: SUM0=${res1['SUM0']} SUM1=${res1['SUM1']} SUM2=${res1['SUM2']} SUM3=${res1['SUM3']} COUT=${res1['COUT']}`);
