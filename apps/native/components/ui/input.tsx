import { cn } from '@/lib/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium',
        className
      )}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}

export { Input };
