export function getErrorMessage(err: unknown): string {
  // If err is a string, return it directly
  if (typeof err === 'string') {
    return err;
  }

  // If err is an Error instance, check the message for known patterns
  if (err instanceof Error) {
    const message = err.message;

    // Check for user rejection/cancellation
    if (
      message.includes('User rejected') ||
      message.includes('user rejected') ||
      message.includes('User denied')
    ) {
      return 'Transaction cancelled. You declined the transaction in your wallet.';
    }

    // Check for insufficient balance (case-insensitive)
    if (message.toLowerCase().includes('insufficient')) {
      return 'Insufficient balance. Check your wallet has enough USDC and SOL for gas fees.';
    }

    // Check for network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('Failed to fetch')
    ) {
      return 'Network error. Check your connection and try again.';
    }

    // Check for timeout errors
    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'Transaction timed out. The network may be congested — please try again.';
    }

    // Check for duplicate transaction
    if (
      message.includes('already in use') ||
      message.includes('already been processed')
    ) {
      return 'This transaction was already processed.';
    }

    // Check for blockhash expiration
    if (message.includes('blockhash')) {
      return 'Transaction expired. Please try again.';
    }

    // Return the original error message for unmatched patterns
    return message;
  }

  // Fallback for unknown error types
  return 'Something went wrong. Please try again or contact support.';
}