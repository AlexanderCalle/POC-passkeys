import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import type { FC } from 'react';

export interface StepperProps {
  items: Omit<StepperItemProps, 'idx'>[];
}

export const Stepper: FC<StepperProps> = ({ items }) => {
  return (
    <div className="flex justify-center items-center w-full p-8 space-x-2">
      {items.map((item, idx) => (
        <StepperItem key={idx} {...item} idx={idx + 1} />
      ))}
    </div>
  );
};

interface StepperItemProps {
  title: string;
  active: boolean;
  idx: number;
}

const stepperVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-accent text-muted-foreground',
      active: 'bg-primary text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const StepperItem: FC<StepperItemProps> = ({ title, active, idx }) => {
  return (
    <>
      {idx > 1 && (
        <span
          className={cn(
            stepperVariants({ variant: active ? 'active' : 'default' }),
            'w-24 h-1 rounded-full',
          )}
        />
      )}
      <div className="flex items-center space-x-2">
        <span
          className={cn(
            stepperVariants({ variant: active ? 'active' : 'default' }),
            'rounded-full aspect-square h-10 w-10 flex items-center justify-center text-lg font-bold',
          )}
        >
          {idx}
        </span>
        <p className="text-md font-semibold">{title}</p>
      </div>
    </>
  );
};
