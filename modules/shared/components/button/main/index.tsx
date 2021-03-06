import * as React from 'react';
// types
import { ButtonPresets } from './presets';
// views
import { InnerWrapper, Wrapper } from './views';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  preset?: ButtonPresets;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  preset = 'default',
  disabled = false,
  children,
  isLoading = false,
  ...rest
}) => (
  <Wrapper preset={preset} disabled={disabled || isLoading} isLoading={isLoading} {...rest}>
    <InnerWrapper>{isLoading ? <div>Loading...</div> : children}</InnerWrapper>
  </Wrapper>
);

export { Button };
