# ⚡ LogicForge — Complete Feature Documentation

---

## 1. Boolean Simplifier & Minimization Engine

### 1.1 Four Multi-Modal Input Modes
1. **Interactive Truth Table (`truth_table`)**:
   - Dynamic 2 to 6 variable grid ($2^2 = 4$ up to $2^6 = 64$ rows).
   - One-click three-state cell toggling: `0` (False) $\to$ `1` (True) $\to$ `X` (Don't Care).
   - Real-time row indexing and binary input labels.
2. **Canonical Minterm / Maxterm Input (`min_max`)**:
   - Toggle between **$\Sigma$ Minterms (SOP 1s)** and **$\Pi$ Maxterms (POS 0s)**.
   - Live comma-separated numeric parsing (e.g., `0, 2, 5, 7`).
   - Dedicated **Don't Cares ($d$)** input field for specifying non-critical states (e.g., `14, 15` in BCD logic).
3. **Algebraic Boolean Expression Parser (`expression`)**:
   - Custom recursive-descent parser supporting all standard digital logic syntax:
     - **AND**: `*`, `&`, `AND`, or implicit juxtaposition (`AB`).
     - **OR**: `+`, `|`, `OR`.
     - **NOT**: Postfix prime tick (`A'`), prefix exclamation (`!A`), tilde (`~A`), or `NOT A`.
     - **XOR / XNOR**: `^`, `XOR`, `XNOR`.
   - Comprehensive syntax validation with friendly error hints and mismatched parenthesis detection.
4. **Natural Language AI Word Problem Solver (`word_problem`)**:
   - Serverless backend function powered by Google Gemini (`gemini-2.5-flash`).
   - Translates English real-world engineering problem statements (e.g., *"A car alarm triggers if the door is open while ignition is on, or if the motion sensor detects movement at night"*) into formal Boolean variables and truth tables.
   - **Review & Confirm Step**: Displays the AI's variable mapping and logic rationale before committing to the circuit generator.
   - Robust offline/fallback warning UX if API tokens or endpoints are unavailable.

### 1.2 Quine–McCluskey Minimization & Optimization
- **Exact Tabular Reduction**: Groups minterms and don't-cares by number of 1-bits ($L_0 \dots L_n$) and performs iterative binary resolution (`0` vs `1` $\to$ `-`).
- **Prime Implicant Chart Reduction**:
  - Automatically identifies and extracts **Essential Prime Implicants (EPIs)**.
  - Implements **Petrick’s Method / branch-and-bound heuristic** to find the absolute minimum covering product sum for cyclic charts.
- **Dual Output Formats**:
  - **SOP (Sum of Products)**: Minimal two-level AND-OR equation.
  - **POS (Product of Sums)**: Minimal two-level OR-AND equation.
  - One-click format switcher updating all downstream circuits in real time.

### 1.3 Interactive Karnaugh Map (K-Map)
- Supports **2-variable ($2 \times 2$), 3-variable ($2 \times 4$), and 4-variable ($4 \times 4$) Gray-code K-Maps**.
- Correct Gray code index ordering (`00, 01, 11, 10`).
- **Loop Grouping Visualizer**: Color-coded grouping boxes illustrating how prime implicants wrap around toroidal edges.
- Clickable cells for direct truth value editing.

### 1.4 Variable Customization
- Dynamic variable sizing from **2 to 6 variables** ($A, B, C, D, E, F$).
- **Inline Variable Renaming**: Rename any variable to a custom 1–3 character identifier (e.g., `CLK`, `RST`, `EN`, `X1`) with real-time propagation across equations, truth tables, and circuit schematics.

---

## 2. Universal Circuit Synthesis & Diagram Generation

### 2.1 Three Generated Schematic Topologies
1. **Standard Multi-Level Circuit**: Synthesizes the optimized function using standard `AND`, `OR`, `NOT`, and `XOR` gates.
2. **NAND-Only Universal Logic Synthesis**:
   - Converts the minimal SOP equation into an optimal 2-level NAND circuit using De Morgan's Law.
   - **Structural Signature Deduplication**: Automatically reuses inverters and identical sub-expressions so gates aren't duplicated.
   - Minimal gate counts (e.g., 3 NANDs for 2-term SOP, 4 NANDs for XOR, exact shared literal inverters).
3. **NOR-Only Universal Logic Synthesis**:
   - Converts the minimal POS equation into an optimal 2-level NOR circuit using De Morgan dual synthesis.
   - Shared input inverters and minimal gate counts.

### 2.2 Formal Equivalence Verification Engine
- Exhaustively simulates all generated circuits (Standard, NAND, NOR) across all $2^N$ input combinations against the original input function.
- Displays a formal **Verification Badge** (`✅ Formal Verification Passed` or `❌ Mismatch Alert`) giving mathematically verified confidence.

---

## 3. Interactive Arithmetic Circuits Lab

Interactive simulation and visualization of 8 classic digital arithmetic architectures:

| Circuit | Configurable Bit-Width | Key Features |
| :--- | :---: | :--- |
| **Half Adder** | 1-bit | `XOR` sum and `AND` carry generation. |
| **Full Adder** | 1-bit + $C_{in}$ | Cascaded half adders with `OR` carry-out. |
| **Ripple-Carry Adder** | **2 to 8 bits** | Multi-bit carry ripple propagation across full adder stages. |
| **Half Subtractor** | 1-bit | Minuend/subtrahend with inverted borrow `A' · B`. |
| **Full Subtractor** | 1-bit + $B_{in}$ | Three-input difference and borrow propagation. |
| **Two's Complement Subtractor** | **2 to 8 bits** | Adder-based subtraction ($A + \sim B + 1$) with hardwired $C_{in} = 1$. |
| **2x2 Binary Multiplier** | 2-bit $\times$ 2-bit | 4 partial-product `AND` gates + 2 half adders (0–3 $\times$ 0–3 = 0–9). |
| **3x3 Binary Multiplier** | 3-bit $\times$ 3-bit | 9 partial-product `AND` gates + 6 adders (0–7 $\times$ 0–7 = 0–49). |

### 3.1 Step-by-Step Logic Propagation Playback
- **Timeline Slider & Depth Stepper**: Animate electrical signals propagating through circuit levels layer by layer.
- **Controls**: `⏮ Reset`, `⏪ Step Back`, `▶ Play Propagation / ⏸ Pause`, `Step Forward ⏩`.
- **Playback Speed Selector**: Choose between `Slow (1.0s)`, `Normal (0.5s)`, and `Fast (0.2s)`.
- **Live Node Value Badges**: Real-time `0` and `1` logic tags on every intermediate gate and wire during animation.

### 3.2 Two's Complement Subtractor: $C_{out}$ vs. No-Borrow Toggle
- Interactive mode toggle:
  - **Raw $C_{out}$ Mode**: Displays the raw hardware carry bit produced by the MSB full adder.
  - **No-Borrow Mode**: Labels the flag semantically ($1 = \text{No Borrow (A} \ge \text{B)}, 0 = \text{Borrow Required (A} < \text{B)}$).
- Highlights whether the output is directly positive or in negative two's-complement form.

### 3.3 Shift-and-Add Multiplier Matrix Visualizer
- Visual grid matrix for both 2x2 and 3x3 multipliers:
  - Multiplicand ($A$) and Multiplier ($B$) written in binary with bit-weight headers ($2^0, 2^1, 2^2\dots$).
  - Shifted partial product rows with active `1` bits highlighted in emerald green.
  - Column-by-column adder summation leading to the final product bits $P_0 \dots P_5$.

### 3.4 In-Depth Bit-Level Educational Explanations
Every arithmetic circuit contains a dedicated educational breakdown:
1. **Circuit Overview**: High-level theory and digital logic principles.
2. **Signal Legend & Wire Labels**: Definitions for every input, intermediate gate (`HA1_XOR`, `AND_i_j`), and output pin.
3. **Logic Equations**: Mathematical Boolean derivations.
4. **Live Dynamic Bitwise Worked Trace**: Real-time substitution of user input values calculating exact gate outputs with decimal/binary verification.

---

## 4. Circuit Schematic Canvas & Rendering Engine

- **Textbook Manhattan Routing**: Clean orthogonal wires with clean 90° bends (no messy curved bezier wires).
- **Zero-Stub Perimeter Snapping**: Wires snap precisely to the perimeter of gate bodies, bubble outputs, and input/output pills without floating gaps.
- **Multi-Port Vertical Distribution**: Multi-input gates evenly distribute input ports along the gate height.
- **Staggered Wire Channels**: Prevents parallel wires between adjacent layers from merging into single lines.
- **Fan-Out Junction Dots**: Distinct connection dots rendered wherever an output wire splits into multiple branches.
- **Interactive Pan & Zoom**:
  - `[+] Zoom In` and `[-] Zoom Out` (40% to 250% scale).
  - `[Reset View]` button.
  - Click-and-drag panning (`cursor-grab`) for easy inspection on mobile and laptop screens.
- **SVG Export**: One-click **"Export SVG"** button on every circuit diagram for high-resolution vector downloads.
- **High-Contrast Styling**: Solid Slate 700 (`#334155`) idle wires and vivid Emerald (`#059669`) active signals over a subtle `#e2e8f0` grid.

---

## 5. User Experience, Presets & Productivity

- **Shareable State via URL**:
  - Automatically serializes active tabs, input modes, variables, minterms, algebraic expressions, and arithmetic operands into URL query parameters.
  - **`🔗 Share`** button with interactive "Link Copied!" toast for instant sharing with classmates or instructors.
- **Quick-Start Example Presets**:
  - **Simplifier Presets**: *Majority Voter (3-Var)*, *Prime Number Detector (4-Var)*, *3-Input XOR/Parity*, and *Security Alarm (Word Problem)*.
  - **Arithmetic Presets**: *3x3 Multiplier ($5 \times 7 = 35$)*, *Subtractor ($7 - 3 = 4$ No Borrow)*, *Subtractor ($2 - 5 = -3$ Borrow)*, and *4-Bit Ripple Adder ($9 + 7 + 1 = 17$)*.
- **Responsive Developer-Tool UI**:
  - Slate & Indigo dark/light theme inspired by modern developer platforms (Linear, Vercel).
  - Monospace typography for binary numbers, hex numbers, expressions, and gate IDs.
- **Accessibility & Polish**:
  - ARIA tab roles, keyboard navigation, descriptive labels on circuit SVGs.
  - Custom vector lightning bolt SVG favicon (`favicon.svg`) and complete OpenGraph/SEO meta tags.

---

## 6. Comprehensive Automated Test Suite

- **50 Automated Unit Tests** across 8 test suites verifying 100% correctness:
  1. `tests/engine/parser.test.ts` (6 tests): Expression tokenization, operator precedence, syntax errors.
  2. `tests/engine/qm.test.ts` (9 tests): Prime implicant grouping, essential PI extraction, cyclic charts.
  3. `tests/engine/qm-exhaustive.test.ts` (1 test): Exhaustive validation of minimization logic.
  4. `tests/engine/simulator.test.ts` (4 tests): DAG evaluation and truth table simulation.
  5. `tests/converters.test.ts` (11 tests): Exact minimal NAND/NOR gate count assertions and De Morgan equivalence.
  6. `tests/arithmetic.test.ts` (13 tests): Exhaustive testing of all 64 3x3 multiplier combinations ($0\text{--}7 \times 0\text{--}7$), all 16 2x2 multiplier combinations, adders, and subtractors ($A < B, A = B, A > B$).
  7. `tests/engine/generator-layout.test.ts` (3 tests): Layering layout and DAG node generation.
  8. `tests/stores.test.ts` (3 tests): Zustand state management and store action workflows.
