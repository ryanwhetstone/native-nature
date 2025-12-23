'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/components/Toast';

type Question = {
  id: number;
  projectId: number;
  question: string;
  response: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  askerName: string | null;
  user: {
    id: string;
    name: string | null;
    publicName: string | null;
  } | null;
};

export default function ManageQuestions({ 
  projectId, 
  questions 
}: { 
  projectId: number;
  questions: Question[];
}) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const unansweredQuestions = questions.filter(q => !q.response);
  const answeredQuestions = questions.filter(q => q.response);

  const handleSubmitResponse = async (questionId: number) => {
    const response = responses[questionId];
    if (!response || response.trim().length === 0) {
      setError('Response cannot be empty');
      return;
    }

    setError('');
    setIsSubmitting(questionId);

    try {
      const res = await fetch(`/api/conservation-project/${projectId}/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: response.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit response');
      }

      // Success - reload the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
      setIsSubmitting(null);
    }
  };

  const handleDeleteResponse = async (questionId: number) => {
    setError('');
    setIsSubmitting(questionId);

    try {
      const res = await fetch(`/api/conservation-project/${projectId}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete response');
      }

      showToast('Response deleted successfully');
      // Success - reload the page
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete response';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setIsSubmitting(null);
      setDeletingQuestionId
      setError(err instanceof Error ? err.message : 'Failed to delete response');
      setIsSubmitting(null);
    }
  };

  if (unansweredQuestions.length === 0 && answeredQuestions.length === 0) {
    return (
      <div className="card">
        <h3 className="heading-4 mb-2">Project Questions</h3>
        <p className="text-muted">No questions have been asked yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <div className="card">
          <h3 className="heading-4 mb-4">
            Unanswered Questions ({unansweredQuestions.length})
          </h3>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {unansweredQuestions.map((question) => {
              const askerName = question.user 
                ? (question.user.publicName || question.user.name || 'Anonymous')
                : (question.askerName || 'Anonymous');
              
              const isExpanded = expandedQuestionId === question.id;

              return (
                <div key={question.id} className="card-bordered">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                      <p className="text-small">
                        Asked by {question.user ? (
                          <Link 
                            href={`/user/${question.user.id}/profile`}
                            className="text-blue-600 hover:underline"
                          >
                            {askerName}
                          </Link>
                        ) : (
                          <span>{askerName}</span>
                        )} on {new Date(question.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}
                      className="btn-primary-sm"
                    >
                      {isExpanded ? 'Cancel' : 'Answer'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label htmlFor={`response-${question.id}`} className="form-label">
                        Your Response
                      </label>
                      <textarea
                        id={`response-${question.id}`}
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
                        rows={4}
                        className="textarea mb-3"
                        placeholder="Type your answer here..."
                      />
                      <button
                        onClick={() => handleSubmitResponse(question.id)}
                        disabled={isSubmitting === question.id}
                        className="btn-primary-sm btn-disabled"
                      >
                        {isSubmitting === question.id ? 'Submitting...' : 'Submit Response'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <div className="card">
          <h3 className="heading-4 mb-4">
            Answered Questions ({answeredQuestions.length})
          </h3>
          <div className="space-y-4">
            {answeredQuestions.map((question) => {
              const askerName = question.user 
                ? (question.user.publicName || question.user.name || 'Anonymous')
                : (question.askerName || 'Anonymous');
const isEditing = editingQuestionId === question.id;

              return (
                <div key={question.id} className="card-bordered">
                  <div className="mb-3">
                    <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                    <p className="text-small">
                      Asked by {question.user ? (
                        <Link 
                          href={`/user/${question.user.id}/profile`}
                          className="text-blue-600 hover:underline"
                        >
                          {askerName}
                        </Link>
                      ) : (
                        <span>{askerName}</span>
                      )} on {new Date(question.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  {question.response && (
                    <div className="card-highlight">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-small font-medium">Your Response:</p>
                        {!isEditing && deletingQuestionId !== question.id && (
                          <div>
                            <button
                              onClick={() => {
                                setEditingQuestionId(question.id);
                                setResponses(prev => ({ ...prev, [question.id]: question.response || '' }));
                              }}
                              className="btn-text-primary mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingQuestionId(question.id)}
                              className="btn-text-danger"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {deletingQuestionId === question.id && (
                          <div>
                            <button
                              onClick={() => handleDeleteResponse(question.id)}
                              disabled={isSubmitting === question.id}
                              className="btn-text-danger btn-disabled mr-4"
                            >
                              {isSubmitting === question.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeletingQuestionId(null)}
                              disabled={isSubmitting === question.id}
                              className="btn-text-gray btn-disabled"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={responses[question.id] || ''}
                            onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
                            rows={4}
                            className="textarea mb-3"
                            placeholder="Type your answer here..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitResponse(question.id)}
                              disabled={isSubmitting === question.id}
                              className="btn-primary-sm btn-disabled"
                            >
                              {isSubmitting === question.id ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingQuestionId(null);
                                setResponses(prev => {
                                  const newResponses = { ...prev };
                                  delete newResponses[question.id];
                                  return newResponses;
                                });
                              }}
                              className="btn-secondary-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900 whitespace-pre-wrap">{question.response}</p>
                          {question.respondedAt && (
                            <p className="text-tiny mt-2">
                              Responded on {new Date(question.respondedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
