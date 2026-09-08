# 2026 Cross-School P6 Science Marker Calibration

## Purpose

This is a **training calibration**, not an official SEAB marking scheme. It was derived from the uploaded Primary 6 prelim/mock Science paper-and-answer packets from 10 Singapore schools:

- Anglo-Chinese School (Junior)
- Ai Tong School
- Nan Chiau Primary School
- Nan Hua Primary School
- Nanyang Primary School
- Paya Lebar Methodist Girls' School (Primary)
- Raffles Girls' Primary School
- Red Swastika School
- CHIJ St Nicholas Girls' School
- Tao Nan School

The aim is to make the app behave more like a careful P6 Science marker while retaining the six Explain frameworks as a teaching scaffold.

## Cross-school consensus rules

### 1. Mark the Science meaning, not model-answer wording

Equivalent scientifically correct wording should be accepted when the required marking points are present. Sentence order, connectors and minor grammar differences are not reasons to reject an answer unless they change the Science meaning.

### 2. Full credit depends on mark-bearing ideas and links

Do not mark by keyword count. A pupil can mention the correct nouns but still miss the causal relationship that earns the mark. If an answer key separates a response into evidence/reason, concept/link, claim/evidence/reason, or multiple half-marks, treat those as distinct mark-bearing ideas.

### 3. Obey the command word first

- **State / Name / Identify / What:** a concise direct answer may be sufficient. Do not demand an explanation that was not asked for.
- **Explain / Why / Give a reason:** require the relevant causal/mechanistic link(s), using the best-fit Explain framework.
- **Describe:** describe the observation/process; do not automatically demand a reason.
- **Suggest:** allow more than one scientifically valid answer where the question permits alternatives.

### 4. Evidence must actually be evidence

For evidence/data questions, the pupil must use the relevant observation, result, reading, graph/table trend or comparison. Restating the conclusion is not a substitute for evidence.

When the question asks for a comparison, the answer must preserve the correct comparative direction, e.g. more/less, higher/lower, faster/slower, greater/smaller, open/closed, can/cannot.

### 5. Context-specific answers beat generic templates

Generic statements such as “to ensure a fair test” are not enough when the question expects the pupil to identify the actual variable or condition kept the same. The marker should look for the specific object, variable, source, pathway, surface, organ, material or observation in the question.

### 6. Continue a causal chain until the asked result is reached

Common patterns across the schemes include:

- change in condition → affected Science process/function → result
- observation/evidence → Science concept → conclusion
- feature → what it enables → survival/function advantage
- starting event → mechanism/process → next effect → outcome
- difference between A and B → Science reason → comparative result

Do not demand extra Science after the exact result has been reached.

### 7. Structure/feature questions require function, not description alone

For adaptations and useful structures, naming or describing a feature is not enough when the question asks how it helps. The answer must link the feature to what it enables and then to the benefit/function where required.

### 8. Heat, water-cycle and gas-process answers must identify the correct source and direction

The schemes repeatedly distinguish:

- which object is hotter/cooler,
- which object gains/loses heat,
- where water vapour came from,
- what surface it contacted,
- and the resulting process such as evaporation/condensation/expansion.

Do not accept a scientifically related process if it uses the wrong source, object or direction.

### 9. Force and energy explanations need the correct relationship

Use the forces/energy forms that are supported by the setup and preserve their relationship. Examples include greater friction causing shorter travel, forces acting in opposing directions, or more/less energy being converted along a stated pathway.

Avoid accepting vague wording such as one force “overcomes” another when the required relationship is that the object is moving **against** a force or that one force is greater than another.

### 10. Reliability, accuracy and fair test are different

- **Improve reliability of numerical results:** repeat trials/readings and calculate/take the average.
- **Why repeat?** The reason may simply be to improve reliability, if repetition is already specified by the question.
- **Accuracy:** use a suitable apparatus/procedure/read-off method so the measurement is close to the actual value.
- **Fair test:** identify the changed variable and measured variable from the question and keep relevant other conditions the same.

Do not substitute one of these ideas for another.

## Six Explain frameworks used by the app

1. **Change → Effect** — Change → affected process/function → result
2. **Mechanism / Process** — Start → mechanism → next effect → outcome
3. **Evidence / Data → Explanation** — Evidence → Science concept → conclusion
4. **Comparison → Explanation** — Relevant difference → Science reason → comparative result
5. **Structure / Feature → Function** — Feature → what it enables → function/advantage
6. **Experimental / Process-skill** — Setup/procedure → why it matters → quality/result

These are teaching frameworks, not official MOE/SEAB categories. Some questions legitimately blend two frameworks.

## Training quality labels

### 🌟 Excellent

The Science is correct and all required framework links are explicit, context-specific and unambiguous. This is the preferred model for mastery training.

### ✅ PSLE-acceptable

The answer contains the required mark-bearing Science and is likely sufficient for full credit, but the expression is more compressed or less polished than the preferred framework model.

### Needs work

One or more mark-bearing Science ideas/links are absent, the evidence is wrong or too generic, the comparison/direction is wrong, or a misconception changes the scientific meaning.

**Important:** “Excellent” and “PSLE-acceptable” are app training labels. They are not official PSLE grades.

## Implementation implications

1. For Explain/Why questions, do not use token overlap with the model answer as an automatic pass. The six-framework reasoning links must still be audited.
2. Cross-school calibration instructions must be placed before long concept-specific rubrics so they are not truncated by the worker's rubric limit.
3. The same calibration policy should load at trainer startup so guided and Application marking use the same rules.
4. A scientifically equivalent answer should never be rejected simply because it uses different connectors or sentence structure.
5. A keyword-heavy answer should never earn full credit when a mark-bearing relationship is missing.
