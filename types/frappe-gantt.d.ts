declare module "frappe-gantt" {
  export interface GanttTask {
    id: string
    name: string
    start: string
    end: string
    progress?: number
    dependencies?: string
    custom_class?: string
    description?: string
    _start?: Date | string
    _end?: Date | string
    [key: string]: unknown
  }

  interface GanttOptions {
    view_mode?: "Hour" | "Quarter Day" | "Half Day" | "Day" | "Week" | "Month" | "Year"
    readonly?: boolean
    readonly_dates?: boolean
    readonly_progress?: boolean
    move_dependencies?: boolean
    infinite_padding?: boolean
    scroll_to?: "start" | "today" | "end"
    today_button?: boolean
    holidays?: Record<string, string>
    on_click?: (task: GanttTask) => void
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void
    on_progress_change?: (task: GanttTask, progress: number) => void
    on_view_change?: (mode: string) => void
    // Frappe Gantt 1.2 passes a context object, not the task itself.
    popup?: (context: GanttPopupContext) => string | void
  }

  export interface GanttPopupContext {
    task: GanttTask
    chart: Gantt
    set_title: (html: string) => void
    set_subtitle: (html: string) => void
    set_details: (html: string) => void
    add_action: (html: string | ((task: GanttTask) => string), func: (task: GanttTask, chart: Gantt, e: Event) => void) => void
  }

  export default class Gantt {
    constructor(element: HTMLElement | string, tasks: GanttTask[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: GanttTask[]): void
    update_task(id: string, task: Partial<GanttTask>): void
    scroll_today(): void
  }
}
