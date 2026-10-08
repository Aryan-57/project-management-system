# Design specification

[Editable Figma designs and states](https://www.figma.com/design/tdjic6MKnon0YSJZALXdcx) cover the web overview, project list/detail, project/task forms, Android auth/overview/projects/tasks/editor, and responsive/recovery notes. The initial nine annotated wireframes were inspected through screenshots. Ten additional visual screen compositions now use reusable product cards/native control patterns, library web inputs/buttons and semantic color bindings. Six text styles distinguish Inter web typography and Roboto Android typography; composition readback returned zero font-family mismatches. The node IDs are recorded in `docs/design-state.json`.

**Exact limitation:** Figma MCP returned “You've reached the Figma MCP tool call limit on the Starter plan” when screenshots of the new visual screens were requested. Those screens are saved and editable, but screenshot review, clipping/layout correction and final high-fidelity acceptance remain unfinished. No claim of a pixel-matched or visually accepted design is made. The implementation-ready design system and state specification below remain available in the repository.

The implemented product uses a quiet green accent (`#45634b`), warm-neutral content, white bordered panels and a slate type hierarchy. Semantic colors and 4/8/16/24/32 spacing originate in `packages/design-tokens`; web maps colors to CSS variables and native controls consume the same token object. Inter with system sans-serif fallback is the web font stack; native uses the platform font for text scaling. Status and priority always include text.

| Surface            | Composition                                                         | Responsive/native behavior                                                   |
| ------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Web authentication | Split editorial welcome + compact form                              | Welcome reduces to brand at <768 px                                          |
| Web overview       | Desktop sidebar, five counters, recent project cards, pending tasks | Counter grid wraps; one-column project cards on phones                       |
| Web projects       | Search/status toolbar, progress cards, pagination                   | Wrapping toolbar and touch-size actions                                      |
| Web project detail | Summary/status/dates, editable metadata, project-scoped tasks       | Task rows become cards, actions stay labelled                                |
| Web editors        | Labelled input fields, status/priority selectors, date fields       | Date columns stack; inline errors and form-level retry text                  |
| Android navigation | Overview / Projects / Tasks / Account tabs, detail/editor stack     | Safe areas, native back, minimum 48 dp action targets                        |
| Android lists      | Cards with status/priority, filter controls, bounded paging         | Native pull-to-refresh and screen-reader action labels                       |
| Android editor     | RHF controllers, native TextInput/Picker, date text input           | Keyboard scrolling, errors remain beside fields, drafts survive failed saves |

| State                | Required treatment                                                 |
| -------------------- | ------------------------------------------------------------------ |
| Loading              | Web skeleton with status label; native spinner + text              |
| Empty                | Explain first project/task; link/action when available             |
| No results           | Explain search/filter combination; clear-filter action             |
| Invalid input        | Field error, accessible association/label; server parses again     |
| Mutation pending     | Disable duplicate action; visible saving text                      |
| Success              | Display only after server response; invalidate relevant data       |
| Server/network error | Clear retry guidance; preserve mounted form state                  |
| Offline              | Connection banner; native cached data labelled potentially stale   |
| Session expired      | Clear session/cache, navigate to login, explicit message           |
| Project deletion     | Accessible confirmation explaining all contained tasks are deleted |

Keyboard skip-link, focus outlines, route focus, Radix dialog focus behavior and labelled native controls are implemented. TalkBack, contrast, enlarged-font and browser layout acceptance remain for the later verification phase. Web card layouts use `<768 px` navigation and `<850 px` task-table collapse; larger content grids also adapt at 1200 px. Native controls scale text; cards and actions wrap rather than assuming a fixed text height.
