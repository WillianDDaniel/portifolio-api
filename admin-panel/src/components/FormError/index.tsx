export default function FormError({ error, message }: { error: boolean; message: string }) {
  return (
    error && (
      <p className="mt-1 text-sm text-red-500">{message}</p>
    )
  );
}
