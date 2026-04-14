import { FormElementType, FileType, type FormViewModel, type ListViewModel, type DropdownKnownList } from '@asoode/shared';

export function useForm() {
  function createInput(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Input, field, label, ...options };
  }

  function createDropDown(field: string, label: string, items: ListViewModel[], options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.DropDown, field, label, items, ...options };
  }

  function createSwitch(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Switch, field, label, ...options };
  }

  function createDatePicker(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.DatePicker, field, label, ...options };
  }

  function createFilePicker(field: string, label: string, fileType: FileType, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.File, field, label, fileType, ...options };
  }

  function createEditor(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Editor, field, label, ...options };
  }

  function createTimezone(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.ZonePicker, field, label, ...options };
  }

  function createColorPicker(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.ColorPicker, field, label, ...options };
  }

  function createCaptcha(field: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Captcha, field, ...options };
  }

  function createNumber(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Number, field, label, ...options };
  }

  function createCheckbox(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Checkbox, field, label, ...options };
  }

  function createRadio(field: string, label: string, items: ListViewModel[], options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.Radio, field, label, items, ...options };
  }

  function createTimePicker(field: string, label: string, options?: Partial<FormViewModel>): FormViewModel {
    return { type: FormElementType.TimePicker, field, label, ...options };
  }

  function prepare(form: FormViewModel[]): { model: any; isValid: boolean } {
    const model: any = {};
    let isValid = true;

    function traverse(fields: FormViewModel[]) {
      fields.forEach((f) => {
        if (f.visible === false) return;
        if (f.elements) {
          traverse(f.elements);
          return;
        }
        if (!f.field) return;

        model[f.field] = f.value;
        f.errors = [];

        if (f.required && (f.value === undefined || f.value === null || f.value === '')) {
          f.errors.push('REQUIRED');
          isValid = false;
        }

        if (f.minLength && typeof f.value === 'string' && f.value.length < f.minLength) {
          f.errors.push('MIN_LENGTH');
          isValid = false;
        }

        if (f.maxLength && typeof f.value === 'string' && f.value.length > f.maxLength) {
          f.errors.push('MAX_LENGTH');
          isValid = false;
        }
      });
    }

    traverse(form);
    return { model, isValid };
  }

  function setModel(form: FormViewModel[], model: any): void {
    function traverse(fields: FormViewModel[]) {
      fields.forEach((f) => {
        if (f.elements) {
          traverse(f.elements);
        } else if (f.field && model && model[f.field] !== undefined) {
          f.value = model[f.field];
        }
      });
    }
    traverse(form);
  }

  function setErrors(form: FormViewModel[], errors: Record<string, string[]>): void {
    function traverse(fields: FormViewModel[]) {
      fields.forEach((f) => {
        if (f.elements) {
          traverse(f.elements);
        } else if (f.field && errors[f.field]) {
          f.errors = errors[f.field];
        }
      });
    }
    traverse(form);
  }

  return {
    createInput, createDropDown, createSwitch, createDatePicker,
    createFilePicker, createEditor, createTimezone, createColorPicker,
    createCaptcha, createNumber, createCheckbox, createRadio, createTimePicker,
    prepare, setModel, setErrors,
  };
}
