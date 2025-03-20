import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <form className="flex flex-col space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Reset password
            </h1>
            <p className="text-sm text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="New password"
                minLength={8}
                maxLength={50}
                required
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Must be 8-50 characters with uppercase, lowercase, number, and
                special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm password"
                minLength={8}
                maxLength={50}
                required
                className="w-full"
              />
            </div>
          </div>

          <SubmitButton
            formAction={resetPasswordAction}
            pendingText="Resetting password..."
            className="w-full"
          >
            Reset password
          </SubmitButton>

          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
