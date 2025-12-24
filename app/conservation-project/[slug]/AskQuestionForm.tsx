'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AskQuestionForm({ projectId }: { projectId: number }) {
  const { data: session } = useSession();
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/conservation-project/${projectId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit question');
      }

      // Success - reload the page to show the new question
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="card mb-6">
        <h2 className="heading-3 mb-4">Ask a Question</h2>
        <p className="text-muted mb-4">
          Have questions about this project? Sign in to ask the project creator!
        </p>
        <Link
          href="/auth/signin"
          className="btn-primary-sm inline-block w-full text-center"
        >
          Sign In to Ask a Question
        </Link>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <h2 className="heading-3 mb-4">Ask a Question</h2>
      <p className="text-muted mb-4">
        Have questions about this project? Ask the project creator!
      </p>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="form-label">
            Your Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows={4}
            className="textarea"
            placeholder="Ask anything about this conservation project..."
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary-sm w-full btn-disabled"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
}
