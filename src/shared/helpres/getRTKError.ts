
type ExpressValidatorError = {
    path: string;
    msg: string;
    [key: string]: any;
}

export interface IRTKError {
    message: string;
    errors: ExpressValidatorError[];
    fieldError?: string;
    status: number;
}

const toastedError : IRTKError = {message: '', errors: [], status: -1};

export function getRTKError(error : any) {
  
    if (error !== undefined && 'data' in error) {
       if ('message' in error.data) toastedError.message = error.data.message;
       if ('errors' in error.data) toastedError.errors = error.data.errors;
       if ('fieldError' in error.data) toastedError.fieldError = error.data.fieldError;
       if ('status' in error) {
        toastedError.status = error.status;
    }
    }
    return toastedError;
}