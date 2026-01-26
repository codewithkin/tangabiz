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
        'bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium border-2 border-transparent',
        Platform.select({
          web: 'focus:border-green-500 outline-none',
        }),
        className
      )}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
}

export { Input };
