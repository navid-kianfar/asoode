import { FormElementType, FileType, DropdownKnownList } from '../../enums';
import { ListViewModel } from './list.model';

export interface FormViewModel {
  type?: FormElementType;
  field?: string;
  label?: string;
  value?: any;
  disabled?: boolean;
  visible?: boolean;
  required?: boolean;
  params?: any;
  cssClass?: string;
  validation?: { [key: string]: any };
  items?: ListViewModel[];
  knownList?: DropdownKnownList;
  fileType?: FileType;
  multiSelect?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  icon?: string;
  buttonAction?: () => void;
  dense?: boolean;
  allowEmpty?: boolean;
  waiting?: boolean;
  errors?: string[];
  elements?: any[];
}
