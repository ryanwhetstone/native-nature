#!/bin/bash

# Refactor utility classes to semantic CSS classes
# Run from project root: bash refactor-css.sh

echo "🔄 Starting CSS refactoring..."

# Function to replace in all .tsx files
refactor() {
  find app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "$1" {} +
}

# Cards
echo "📦 Refactoring cards..."
refactor 's/className="bg-white rounded-lg shadow-md p-6"/className="card"/g'
refactor 's/className="bg-white rounded-lg shadow-sm p-4"/className="card-sm"/g'
refactor 's/className="bg-white rounded-lg shadow-lg p-8"/className="card-lg"/g'
refactor 's/className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"/className="card-hover"/g'
refactor 's/className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"/className="project-card"/g'
refactor 's/className="bg-white rounded-lg shadow p-12 text-center"/className="empty-state"/g'
refactor 's/className="border border-gray-200 rounded-lg p-4"/className="card-bordered"/g'
refactor 's/className="bg-green-50 rounded-lg p-3"/className="card-highlight"/g'

# Buttons - Primary (Green)
echo "🔘 Refactoring buttons..."
refactor 's/className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"/className="btn-primary"/g'
refactor 's/className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium"/className="btn-primary-sm"/g'
refactor 's/className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"/className="btn-primary-sm"/g'
refactor 's/className="px-8 py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700 transition-colors font-semibold"/className="btn-primary-lg"/g'

# Handle disabled buttons
refactor 's/className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"/className="btn-primary-sm btn-disabled"/g'
refactor 's/className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"/className="btn-primary-sm btn-disabled"/g'

# Buttons - Secondary (Gray)
refactor 's/className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"/className="btn-secondary"/g'
refactor 's/className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"/className="btn-secondary-sm"/g'

# Buttons - Action colors
refactor 's/className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"/className="btn-blue"/g'
refactor 's/className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"/className="btn-purple"/g'
refactor 's/className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"/className="btn-indigo"/g'

# Buttons - Danger
refactor 's/className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100 transition-colors whitespace-nowrap"/className="btn-danger"/g'

# Text Buttons
refactor 's/className="text-sm text-blue-600 hover:text-blue-700 font-medium"/className="btn-text-primary"/g'
refactor 's/className="text-sm text-red-600 hover:text-red-700 font-medium"/className="btn-text-danger"/g'
refactor 's/className="text-sm text-gray-600 hover:text-gray-700 font-medium"/className="btn-text-gray"/g'

# Forms
echo "📝 Refactoring forms..."
refactor 's/className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"/className="input"/g'
refactor 's/className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"/className="textarea"/g'
refactor 's/className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"/className="textarea"/g'
refactor 's/className="block text-sm font-medium text-gray-700 mb-1"/className="form-label"/g'
refactor 's/className="block text-sm font-medium text-gray-700 mb-2"/className="form-label"/g'

# Error/Success boxes
refactor 's/className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"/className="error-box"/g'
refactor 's/className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"/className="success-box"/g'

# Typography
echo "✍️  Refactoring typography..."
refactor 's/className="text-4xl font-bold text-gray-900"/className="heading-1"/g'
refactor 's/className="text-3xl font-bold text-gray-900"/className="heading-2"/g'
refactor 's/className="text-2xl font-bold text-gray-900"/className="heading-3"/g'
refactor 's/className="text-2xl font-semibold text-gray-900"/className="heading-3"/g'
refactor 's/className="text-xl font-semibold text-gray-900"/className="heading-4"/g'
refactor 's/className="text-gray-600"/className="text-muted"/g'
refactor 's/className="text-sm text-gray-600"/className="text-small"/g'
refactor 's/className="text-sm text-gray-500"/className="text-small"/g'
refactor 's/className="text-xs text-gray-500"/className="text-tiny"/g'

# Layout
echo "🗂️  Refactoring layout..."
refactor 's/className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"/className="modal-overlay"/g'
refactor 's/className="bg-white rounded-lg max-w-md w-full p-6"/className="modal-content"/g'
refactor 's/className="bg-white rounded-lg max-w-2xl w-full p-6"/className="modal-content-lg"/g'
refactor 's/className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-xl"/className="step-number"/g'

echo "✅ CSS refactoring complete!"
echo "📊 Run 'git diff --stat' to see changes"
