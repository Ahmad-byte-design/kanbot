import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../../../assets/icons';
import { TextField, type TextFieldProps } from '../../../components/ui/text-field';

export function PasswordField(props: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...props}
      type={showPassword ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
