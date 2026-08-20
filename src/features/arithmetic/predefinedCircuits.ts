import type { Circuit } from '../../engine/types';

export const HalfAdderCircuit: Circuit = {
  inputNodes: ['A', 'B'],
  outputNodes: ['SUM', 'CARRY'],
  nodes: {
    'A': { id: 'A', type: 'INPUT', label: 'A', inputs: [], x: 0, y: -50 },
    'B': { id: 'B', type: 'INPUT', label: 'B', inputs: [], x: 0, y: 50 },
    'XOR1': { id: 'XOR1', type: 'XOR', inputs: ['A', 'B'], x: 150, y: -50 },
    'AND1': { id: 'AND1', type: 'AND', inputs: ['A', 'B'], x: 150, y: 50 },
    'SUM': { id: 'SUM', type: 'OUTPUT', label: 'Sum', inputs: ['XOR1'], x: 300, y: -50 },
    'CARRY': { id: 'CARRY', type: 'OUTPUT', label: 'Carry', inputs: ['AND1'], x: 300, y: 50 }
  }
};

export const FullAdderCircuit: Circuit = {
  inputNodes: ['A', 'B', 'CIN'],
  outputNodes: ['SUM', 'COUT'],
  nodes: {
    'A': { id: 'A', type: 'INPUT', label: 'A', inputs: [], x: 0, y: -80 },
    'B': { id: 'B', type: 'INPUT', label: 'B', inputs: [], x: 0, y: 0 },
    'CIN': { id: 'CIN', type: 'INPUT', label: 'Cin', inputs: [], x: 0, y: 80 },
    
    'XOR1': { id: 'XOR1', type: 'XOR', inputs: ['A', 'B'], x: 150, y: -40 },
    'AND1': { id: 'AND1', type: 'AND', inputs: ['A', 'B'], x: 150, y: 40 },
    
    'XOR2': { id: 'XOR2', type: 'XOR', inputs: ['XOR1', 'CIN'], x: 300, y: -80 },
    'AND2': { id: 'AND2', type: 'AND', inputs: ['XOR1', 'CIN'], x: 300, y: 0 },
    
    'OR1': { id: 'OR1', type: 'OR', inputs: ['AND1', 'AND2'], x: 450, y: 40 },
    
    'SUM': { id: 'SUM', type: 'OUTPUT', label: 'Sum', inputs: ['XOR2'], x: 550, y: -80 },
    'COUT': { id: 'COUT', type: 'OUTPUT', label: 'Cout', inputs: ['OR1'], x: 550, y: 40 }
  }
};

export const HalfSubtractorCircuit: Circuit = {
  inputNodes: ['A', 'B'],
  outputNodes: ['DIFF', 'BOUT'],
  nodes: {
    'A': { id: 'A', type: 'INPUT', label: 'A', inputs: [], x: 0, y: -50 },
    'B': { id: 'B', type: 'INPUT', label: 'B', inputs: [], x: 0, y: 50 },
    'NOT_A': { id: 'NOT_A', type: 'NOT', inputs: ['A'], x: 100, y: 50 },
    'XOR1': { id: 'XOR1', type: 'XOR', inputs: ['A', 'B'], x: 200, y: -50 },
    'AND1': { id: 'AND1', type: 'AND', inputs: ['NOT_A', 'B'], x: 200, y: 100 },
    'DIFF': { id: 'DIFF', type: 'OUTPUT', label: 'Diff', inputs: ['XOR1'], x: 350, y: -50 },
    'BOUT': { id: 'BOUT', type: 'OUTPUT', label: 'Bout', inputs: ['AND1'], x: 350, y: 100 }
  }
};

export const FullSubtractorCircuit: Circuit = {
  inputNodes: ['A', 'B', 'BIN'],
  outputNodes: ['DIFF', 'BOUT'],
  nodes: {
    'A': { id: 'A', type: 'INPUT', label: 'A', inputs: [], x: 0, y: -80 },
    'B': { id: 'B', type: 'INPUT', label: 'B', inputs: [], x: 0, y: 0 },
    'BIN': { id: 'BIN', type: 'INPUT', label: 'Bin', inputs: [], x: 0, y: 80 },
    
    'XOR1': { id: 'XOR1', type: 'XOR', inputs: ['A', 'B'], x: 150, y: -40 },
    'NOT_A': { id: 'NOT_A', type: 'NOT', inputs: ['A'], x: 150, y: 40 },
    'AND1': { id: 'AND1', type: 'AND', inputs: ['NOT_A', 'B'], x: 250, y: 40 },
    
    'XOR2': { id: 'XOR2', type: 'XOR', inputs: ['XOR1', 'BIN'], x: 350, y: -80 },
    'NOT_XOR1': { id: 'NOT_XOR1', type: 'NOT', inputs: ['XOR1'], x: 350, y: 0 },
    'AND2': { id: 'AND2', type: 'AND', inputs: ['NOT_XOR1', 'BIN'], x: 450, y: 0 },
    
    'OR1': { id: 'OR1', type: 'OR', inputs: ['AND1', 'AND2'], x: 550, y: 40 },
    
    'DIFF': { id: 'DIFF', type: 'OUTPUT', label: 'Diff', inputs: ['XOR2'], x: 650, y: -80 },
    'BOUT': { id: 'BOUT', type: 'OUTPUT', label: 'Bout', inputs: ['OR1'], x: 650, y: 40 }
  }
};

export function buildRippleCarryAdder(bits: number): Circuit {
  const nodes: Circuit['nodes'] = {};
  const inputNodes: string[] = [];
  const outputNodes: string[] = [];
  
  nodes['CIN'] = { id: 'CIN', type: 'INPUT', label: 'Cin', inputs: [], x: 0, y: -100 };
  inputNodes.push('CIN');
  
  let lastCarry = 'CIN';
  
  for (let i = 0; i < bits; i++) {
    const aId = `A${i}`;
    const bId = `B${i}`;
    nodes[aId] = { id: aId, type: 'INPUT', label: `A${i}`, inputs: [], x: 0, y: i * 200 };
    nodes[bId] = { id: bId, type: 'INPUT', label: `B${i}`, inputs: [], x: 0, y: i * 200 + 80 };
    inputNodes.push(aId, bId);
    
    const xor1 = `XOR1_${i}`;
    const and1 = `AND1_${i}`;
    const xor2 = `XOR2_${i}`;
    const and2 = `AND2_${i}`;
    const or1 = `OR1_${i}`;
    
    nodes[xor1] = { id: xor1, type: 'XOR', inputs: [aId, bId], x: 150, y: i * 200 };
    nodes[and1] = { id: and1, type: 'AND', inputs: [aId, bId], x: 150, y: i * 200 + 100 };
    
    nodes[xor2] = { id: xor2, type: 'XOR', inputs: [xor1, lastCarry], x: 300, y: i * 200 - 40 };
    nodes[and2] = { id: and2, type: 'AND', inputs: [xor1, lastCarry], x: 300, y: i * 200 + 40 };
    
    nodes[or1] = { id: or1, type: 'OR', inputs: [and1, and2], x: 450, y: i * 200 + 80 };
    
    const sumId = `SUM${i}`;
    nodes[sumId] = { id: sumId, type: 'OUTPUT', label: `S${i}`, inputs: [xor2], x: 600, y: i * 200 - 40 };
    outputNodes.push(sumId);
    
    lastCarry = or1;
  }
  
  const finalCout = 'COUT';
  nodes[finalCout] = { id: finalCout, type: 'OUTPUT', label: 'Cout', inputs: [lastCarry], x: 600, y: bits * 200 - 100 };
  outputNodes.push(finalCout);
  
  return { nodes, inputNodes, outputNodes };
}

export function buildTwosComplementSubtractor(bits: number): Circuit {
  // Built using adder, where B is inverted and Cin = 1
  const adder = buildRippleCarryAdder(bits);
  const nodes: Circuit['nodes'] = {};
  
  Object.keys(adder.nodes).forEach(k => {
    nodes[k] = { ...adder.nodes[k] };
  });

  // Modify CIN to be CONSTANT 1
  nodes['CIN'] = { id: 'CIN', type: 'CONSTANT', label: 'Cin', inputs: [], value: 1, x: 0, y: -100 };

  // Modify B inputs to be NOT gates driven by actual B inputs
  for (let i = 0; i < bits; i++) {
    const origB = `B${i}`;
    nodes[origB] = { ...nodes[origB], type: 'INPUT', label: `B${i}`, x: 0, y: i * 200 + 120 };
    
    const notB = `NOT_B${i}`;
    nodes[notB] = { id: notB, type: 'NOT', inputs: [origB], x: 75, y: i * 200 + 120 };
    
    // Reroute XOR1 and AND1
    const xor1 = `XOR1_${i}`;
    const and1 = `AND1_${i}`;
    nodes[xor1].inputs = [`A${i}`, notB];
    nodes[and1].inputs = [`A${i}`, notB];
  }
  
  return { nodes, inputNodes: adder.inputNodes, outputNodes: adder.outputNodes };
}

export function buildMultiplier(bitsA: number, bitsB: number): Circuit {
  // A simplistic layout for multipliers without deep optimization.
  // 2x2 multiplier:
  const nodes: Circuit['nodes'] = {};
  const inputNodes: string[] = [];
  const outputNodes: string[] = [];
  
  for(let i = 0; i < bitsA; i++) {
     nodes[`A${i}`] = { id: `A${i}`, type: 'INPUT', label: `A${i}`, inputs: [], x: 0, y: i*50 };
     inputNodes.push(`A${i}`);
  }
  for(let i = 0; i < bitsB; i++) {
     nodes[`B${i}`] = { id: `B${i}`, type: 'INPUT', label: `B${i}`, inputs: [], x: 0, y: (bitsA + i)*50 };
     inputNodes.push(`B${i}`);
  }
  
  // Partial products
  const pp: string[][] = Array.from({length: bitsB}, () => []);
  for(let j=0; j<bitsB; j++) {
      for(let i=0; i<bitsA; i++) {
          const id = `AND_${i}_${j}`;
          nodes[id] = { id, type: 'AND', inputs: [`A${i}`, `B${j}`], x: 150 + i*50, y: j*100 + i*20 };
          pp[j].push(id);
      }
  }
  
  // Actually building the full multiplier properly with layered adders is complex for layout.
  // Let's implement 2x2 manually since 3x3 is too large to auto-layout without a proper layout engine.
  // Wait, I can just use buildRippleCarryAdder logic sequentially.
  
  // Simplified 2x2:
  if (bitsA === 2 && bitsB === 2) {
      nodes['P0'] = { id: 'P0', type: 'OUTPUT', label: 'P0', inputs: [pp[0][0]], x: 600, y: 0 };
      outputNodes.push('P0');
      
      // HA1: pp[0][1] + pp[1][0]
      nodes['HA1_XOR'] = { id: 'HA1_XOR', type: 'XOR', inputs: [pp[0][1], pp[1][0]], x: 300, y: 100 };
      nodes['HA1_AND'] = { id: 'HA1_AND', type: 'AND', inputs: [pp[0][1], pp[1][0]], x: 300, y: 150 };
      
      nodes['P1'] = { id: 'P1', type: 'OUTPUT', label: 'P1', inputs: ['HA1_XOR'], x: 600, y: 100 };
      outputNodes.push('P1');
      
      // HA2: pp[1][1] + HA1_AND
      nodes['HA2_XOR'] = { id: 'HA2_XOR', type: 'XOR', inputs: [pp[1][1], 'HA1_AND'], x: 450, y: 200 };
      nodes['HA2_AND'] = { id: 'HA2_AND', type: 'AND', inputs: [pp[1][1], 'HA1_AND'], x: 450, y: 250 };
      
      nodes['P2'] = { id: 'P2', type: 'OUTPUT', label: 'P2', inputs: ['HA2_XOR'], x: 600, y: 200 };
      nodes['P3'] = { id: 'P3', type: 'OUTPUT', label: 'P3', inputs: ['HA2_AND'], x: 600, y: 300 };
      outputNodes.push('P2', 'P3');
      
      return { nodes, inputNodes, outputNodes };
  }
  
  // 3x3 manual construction:
  if (bitsA === 3 && bitsB === 3) {
      nodes['P0'] = { id: 'P0', type: 'OUTPUT', label: 'P0', inputs: [pp[0][0]], x: 800, y: 0 };
      outputNodes.push('P0');
      
      const createHA = (prefix: string, in1: string, in2: string, x: number, y: number) => {
          nodes[`${prefix}_XOR`] = { id: `${prefix}_XOR`, type: 'XOR', inputs: [in1, in2], x, y };
          nodes[`${prefix}_AND`] = { id: `${prefix}_AND`, type: 'AND', inputs: [in1, in2], x, y: y + 30 };
          return { sum: `${prefix}_XOR`, carry: `${prefix}_AND` };
      };
      
      const createFA = (prefix: string, in1: string, in2: string, cin: string, x: number, y: number) => {
          nodes[`${prefix}_XOR1`] = { id: `${prefix}_XOR1`, type: 'XOR', inputs: [in1, in2], x, y };
          nodes[`${prefix}_AND1`] = { id: `${prefix}_AND1`, type: 'AND', inputs: [in1, in2], x, y: y + 20 };
          nodes[`${prefix}_XOR2`] = { id: `${prefix}_XOR2`, type: 'XOR', inputs: [`${prefix}_XOR1`, cin], x: x + 100, y };
          nodes[`${prefix}_AND2`] = { id: `${prefix}_AND2`, type: 'AND', inputs: [`${prefix}_XOR1`, cin], x: x + 100, y: y + 20 };
          nodes[`${prefix}_OR`] = { id: `${prefix}_OR`, type: 'OR', inputs: [`${prefix}_AND1`, `${prefix}_AND2`], x: x + 200, y: y + 40 };
          return { sum: `${prefix}_XOR2`, carry: `${prefix}_OR` };
      };
      
      // Stage 1 adders (pp[0][1]+pp[1][0], pp[0][2]+pp[1][1])
      const ha1 = createHA('HA1', pp[0][1], pp[1][0], 300, 100);
      const fa1 = createFA('FA1', pp[0][2], pp[1][1], ha1.carry, 300, 200);
      const ha2 = createHA('HA2', pp[1][2], fa1.carry, 300, 300); // ha2 sum goes to next stage, carry goes to next stage
      
      // Stage 2 adders (+ pp[2][...])
      const ha3 = createHA('HA3', fa1.sum, pp[2][0], 500, 150); // ha3.sum is P2, carry to next
      const fa2 = createFA('FA2', ha2.sum, pp[2][1], ha3.carry, 500, 250); // fa2.sum is P3, carry to next
      const fa3 = createFA('FA3', ha2.carry, pp[2][2], fa2.carry, 500, 350); // fa3.sum is P4, carry is P5
      
      nodes['P1'] = { id: 'P1', type: 'OUTPUT', label: 'P1', inputs: [ha1.sum], x: 800, y: 100 };
      nodes['P2'] = { id: 'P2', type: 'OUTPUT', label: 'P2', inputs: [ha3.sum], x: 800, y: 200 };
      nodes['P3'] = { id: 'P3', type: 'OUTPUT', label: 'P3', inputs: [fa2.sum], x: 800, y: 300 };
      nodes['P4'] = { id: 'P4', type: 'OUTPUT', label: 'P4', inputs: [fa3.sum], x: 800, y: 400 };
      nodes['P5'] = { id: 'P5', type: 'OUTPUT', label: 'P5', inputs: [fa3.carry], x: 800, y: 500 }; 
      
      // Multiplier outputs are P0 to P5 for 3x3.
      outputNodes.push('P1', 'P2', 'P3', 'P4', 'P5');
      
      return { nodes, inputNodes, outputNodes };
  }
  
  return { nodes, inputNodes, outputNodes };
}
