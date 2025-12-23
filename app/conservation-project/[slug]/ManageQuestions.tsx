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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Questions</h3>
        <p className="text-gray-600">No questions have been asked yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Unanswered Questions ({unansweredQuestions.length})
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                      <p className="text-sm text-gray-500">
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
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {isExpanded ? 'Cancel' : 'Answer'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label htmlFor={`response-${question.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Your Response
                      </label>
                      <textarea
                        id={`response-${question.id}`}
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                        placeholder="Type your answer here..."
                      />
                      <button
                        onClick={() => handleSubmitResponse(question.id)}
                        disabled={isSubmitting === question.id}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Answered Questions ({answeredQuestions.length})
          </h3>
          <div className="space-y-4">
            {answeredQuestions.map((question) => {
              const askerName = question.user 
                ? (question.user.publicName || question.user.name || 'Anonymous')
                : (question.askerName || 'Anonymous');
const isEditing = editingQuestionId === question.id;

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                    <p className="text-sm text-gray-500">
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
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-600 font-medium">Your Response:</p>
                        {!isEditing && deletingQuestionId !== question.id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingQuestionId(question.id);
                                setResponses(prev => ({ ...prev, [question.id]: question.response || '' }));
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingQuestionId(question.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {deletingQuestionId === question.id && (
                          <>
                            <button
                              onClick={() => handleDeleteResponse(question.id)}
                              disabled={isSubmitting === question.id}
                              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting === question.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeletingQuestionId(null)}
                              disabled={isSubmitting === question.id}
                              className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={responses[question.id] || ''}
                            onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                            placeholder="Type your answer here..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitResponse(question.id)}
                              disabled={isSubmitting === question.id}
                              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900 whitespace-pre-wrap">{question.response}</p>
                          {question.respondedAt && (
                            <p className="text-xs text-gray-500 mt-2">
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
