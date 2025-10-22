// React type augmentation for non-standard directory upload attributes
import 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> extends React.AriaAttributes, React.DOMAttributes<T> {
    webkitdirectory?: boolean;
    directory?: boolean;
    mozdirectory?: boolean;
  }
}

