'use client';

interface DeleteButtonProps {
  formAction: (formData: FormData) => void;
  confirmMessage: string;
  buttonText: string;
  children?: React.ReactNode;
}

export function DeleteButton({ formAction, confirmMessage, buttonText, children }: DeleteButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {children}
      <button
        type="submit"
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        {buttonText}
      </button>
    </form>
  );
}
