import { IDateEvent } from '../core/date.model';

export interface DashboardViewModel {
  events: IDateEvent[];
  overall: OverallViewModel;
  progress: DayReportViewModel[];
}

export interface OverallViewModel {
  total: number;
  done: number;
  blocked: number;
  inProgress: number;
}

export interface DayReportViewModel extends OverallViewModel {
  date: Date;
}
