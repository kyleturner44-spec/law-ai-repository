import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, XCircle, Tag, Trash2 } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';

const AIUseCaseRepository = () => {
  const [view, setView] = useState('browse');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedCategoryForReview, setSelectedCategoryForReview] = useState('');
  const [adminTab, setAdminTab] = useState('pending');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    useCase: '',
    submittedBy: ''
  });

  // Load data from Firebase on component mount
  useEffect(() => {
    loadSubmissions();
    loadCategories();
  }, []);

  // Load submissions from Firestore
  const loadSubmissions = async () => {
    try {
      const submissionsCollection = collection(db, 'submissions');
      const submissionsSnapshot = await getDocs(submissionsCollection);
      const submissionsList = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setLoading(false);
    }
  };

  // Load categories from Firestore
  const loadCategories = async () => {
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map(doc => doc.data().name);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Admin login
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Invalid password');
    }
  };

  // Submit new use case to Firebase
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.useCase || !formData.submittedBy) {
      alert('Please fill out all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'submissions'), {
        title: formData.title,
        description: formData.description,
        useCase: formData.useCase,
        submittedBy: formData.submittedBy,
        status: 'pending',
        category: '',
        tags: [],
        submittedDate: new Date().toISOString().split('T')[0]
      });

      setFormData({ title: '', description: '', useCase: '', submittedBy: '' });
      alert('Submission received! It will be reviewed by administrators.');
      loadSubmissions();
      setView('browse');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting. Please try again.');
    }
  };

  // Admin approve submission
  const handleApprove = async (id, category) => {
    if (!category) {
      alert('Please select a category');
      return;
    }

    try {
      await updateDoc(doc(db, 'submissions', id), {
        status: 'approved',
        category: category
      });
      setSelectedCategoryForReview('');
      loadSubmissions();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error approving submission.');
    }
  };

  // Admin reject submission
  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, 'submissions', id));
      loadSubmissions();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting submission.');
    }
  };

  // Delete approved submission
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await deleteDoc(doc(db, 'submissions', id));
        loadSubmissions();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting submission.');
      }
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (newCategoryInput.trim() && !categories.includes(newCategoryInput.trim())) {
      try {
        await addDoc(collection(db, 'categories'), {
          name: newCategoryInput.trim()
        });
        setNewCategoryInput('');
        loadCategories();
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category.');
      }
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryName) => {
    try {
      const categoriesCollection = collection(db, 'categories');
      const q = query(categoriesCollection, where('name', '==', categoryName));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(doc(db, 'categories', docSnapshot.id));
      });
      
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category.');
    }
  };

  // Filter submissions
  const filterSubmissions = (list, status = null) => {
    return list.filter(s => {
      const matchesStatus = status ? s.status === status : true;
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  const pendingSubmissions = filterSubmissions(submissions, 'pending');
  const approvedSubmissions = filterSubmissions(submissions, 'approved');

  // LOADING VIEW
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN VIEW
  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAdminLogin}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowAdminLogin(false);
                setAdminPassword('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Password: admin123</p>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-300">Manage submissions and categories</p>
            </div>
            <button
              onClick={() => {
                setIsAdmin(false);
                setView('browse');
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setAdminTab('pending')}
              className={`px-6 py-2 rounded-lg transition font-semibold ${
                adminTab === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Review Pending ({pendingSubmissions.length})
            </button>
            <button
              onClick={() => setAdminTab('approved')}
              className={`px-6 py-2 rounded-lg transition font-semibold ${
                adminTab === 'approved'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Manage Approved ({approvedSubmissions.length})
            </button>
            <button
              onClick={() => setAdminTab('categories')}
              className={`px-6 py-2 rounded-lg transition font-semibold ${
                adminTab === 'categories'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Manage Categories
            </button>
          </div>

          {adminTab === 'pending' && (
            <div>
              {pendingSubmissions.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-400 text-lg">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingSubmissions.map(submission => (
                    <div key={submission.id} className="bg-gray-800 rounded-lg p-6 border-l-4 border-yellow-500">
                      <h3 className="text-xl font-bold text-white mb-2">{submission.title}</h3>
                      <p className="text-gray-300 mb-3">{submission.description}</p>
                      <p className="text-sm text-gray-400 mb-4"><strong>Benefits:</strong> {submission.useCase}</p>
                      <p className="text-xs text-gray-500 mb-4">Submitted by {submission.submittedBy} on {submission.submittedDate}</p>
                      
                      <div className="flex gap-3 items-end mb-4 flex-wrap">
                        <div className="flex-1 min-w-xs">
                          <label className="block text-sm text-gray-300 mb-2">Select Category</label>
                          <select
                            value={selectedCategoryForReview}
                            onChange={(e) => setSelectedCategoryForReview(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Choose a category...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            handleApprove(submission.id, selectedCategoryForReview);
                            setSelectedCategoryForReview('');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2 font-semibold"
                        >
                          <CheckCircle size={18} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2 font-semibold"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'approved' && (
            <div>
              {approvedSubmissions.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-400 text-lg">No approved submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedSubmissions.map(submission => (
                    <div key={submission.id} className="bg-gray-800 rounded-lg p-6 border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-white">{submission.title}</h3>
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2 font-semibold"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                      <p className="text-gray-300 mb-2">{submission.description}</p>
                      <p className="text-sm bg-indigo-900 text-indigo-200 inline-block px-3 py-1 rounded mb-3">
                        Category: {submission.category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {submission.tags && submission.tags.map(tag => (
                          <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'categories' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Current Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {categories.map(cat => (
                  <div key={cat} className="bg-gray-700 p-4 rounded flex justify-between items-center">
                    <span className="text-white">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-red-400 hover:text-red-300 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter new category name"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-semibold"
                >
                  Add Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // BROWSE VIEW
  if (view === 'browse') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Law Student AI Use Cases</h1>
            <p className="text-gray-600">Discover practical applications of AI in legal practice</p>
          </div>

          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setView('browse')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Browse
            </button>
            <button
              onClick={() => setView('submit')}
              className="px-6 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold"
            >
              Submit
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search use cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approvedSubmissions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No use cases found. Be the first to submit one!</p>
              </div>
            ) : (
              approvedSubmissions.map(submission => (
                <div key={submission.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 flex-1">{submission.title}</h3>
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  </div>
                  <p className="text-sm text-indigo-600 font-semibold mb-3 flex items-center gap-2">
                    <Tag size={16} /> {submission.category}
                  </p>
                  <p className="text-gray-700 mb-3">{submission.description}</p>
                  <p className="text-sm text-gray-600 mb-4"><strong>Use Case:</strong> {submission.useCase}</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.tags && submission.tags.map(tag => (
                      <span key={tag} className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Submitted by {submission.submittedBy}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // SUBMIT VIEW
  if (view === 'submit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Submit an AI Use Case</h1>
            <p className="text-gray-600">Share your innovative ideas for AI in legal practice</p>
          </div>

          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setView('browse')}
              className="px-6 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold"
            >
              Browse
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.submittedBy}
                onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Use Case Title</label>
              <input
                type="text"
                placeholder="e.g., Contract Review Automation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Describe the AI use case in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">How It Benefits Legal Practice</label>
              <textarea
                placeholder="Explain the practical benefits and outcomes..."
                value={formData.useCase}
                onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Submit Use Case
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default AIUseCaseRepository;