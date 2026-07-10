import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  className = '',
  inputClassName = 'form-input',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className={`password-input-wrap ${className}`.trim()}>
      <input
        {...props}
        className={`${inputClassName} password-input`.trim()}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
