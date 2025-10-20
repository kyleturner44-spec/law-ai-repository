import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, XCircle, Tag, Trash2, LogOut } from 'lucide-react';
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

  useEffect(() => {
    loadSubmissions();
    loadCategories();
  }, []);

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

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Invalid password');
    }
  };

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

  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, 'submissions', id));
      loadSubmissions();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting submission.');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-amber-600">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-600 mb-6">Enter your password to continue</p>
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 mb-4 transition"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAdminLogin}
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowAdminLogin(false);
                setAdminPassword('');
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage submissions and categories</p>
            </div>
            <button
              onClick={() => {
                setIsAdmin(false);
                setView('browse');
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            <button
              onClick={() => setAdminTab('pending')}
              className={`px-6 py-3 rounded-lg transition font-semibold ${
                adminTab === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-600'
              }`}
            >
              Pending ({pendingSubmissions.length})
            </button>
            <button
              onClick={() => setAdminTab('approved')}
              className={`px-6 py-3 rounded-lg transition font-semibold ${
                adminTab === 'approved'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-600'
              }`}
            >
              Approved ({approvedSubmissions.length})
            </button>
            <button
              onClick={() => setAdminTab('categories')}
              className={`px-6 py-3 rounded-lg transition font-semibold ${
                adminTab === 'categories'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-600'
              }`}
            >
              Categories
            </button>
          </div>

          {adminTab === 'pending' && (
            <div>
              {pendingSubmissions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingSubmissions.map(submission => (
                    <div key={submission.id} className="bg-white rounded-xl p-6 border-l-4 border-amber-600 shadow-md hover:shadow-lg transition">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{submission.title}</h3>
                      <p className="text-gray-700 mb-3">{submission.description}</p>
                      <p className="text-sm text-gray-600 mb-4"><strong>Benefits:</strong> {submission.useCase}</p>
                      <p className="text-xs text-gray-500 mb-4">By {submission.submittedBy} • {submission.submittedDate}</p>
                      
                      <div className="flex gap-3 items-end mb-4 flex-wrap">
                        <div className="flex-1 min-w-xs">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                          <select
                            value={selectedCategoryForReview}
                            onChange={(e) => setSelectedCategoryForReview(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 transition"
                          >
                            <option value="">Select category...</option>
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
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold"
                        >
                          <CheckCircle size={18} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-semibold"
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
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">No approved submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedSubmissions.map(submission => (
                    <div key={submission.id} className="bg-white rounded-xl p-6 border-l-4 border-green-600 shadow-md hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{submission.title}</h3>
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-semibold"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                      <p className="text-gray-700 mb-2">{submission.description}</p>
                      <p className="text-sm bg-amber-100 text-amber-900 inline-block px-3 py-1 rounded-full mb-3 font-semibold">
                        {submission.category}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'categories' && (
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Manage Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {categories.map(cat => (
                  <div key={cat} className="bg-gradient-to-r from-amber-50 to-gray-50 p-4 rounded-lg border-2 border-gray-200 flex justify-between items-center hover:border-amber-600 transition">
                    <span className="text-gray-900 font-semibold">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-red-600 hover:text-red-700 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 transition"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'browse') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">AI Use Cases for Law</h1>
            <p className="text-gray-600 text-lg">Discover how law students are leveraging AI in legal practice</p>
          </div>

          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setView('browse')}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
            >
              Browse
            </button>
            <button
              onClick={() => setView('submit')}
              className="px-6 py-3 bg-white border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition font-semibold"
            >
              Submit
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-gray-100">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search use cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 transition font-medium"
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
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 text-lg font-medium">No use cases yet. Submit one to get started!</p>
              </div>
            ) : (
              approvedSubmissions.map(submission => (
                <div key={submission.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-amber-600 group">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition flex-1">{submission.title}</h3>
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  </div>
                  <p className="inline-block px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 rounded-full text-sm font-semibold mb-4">
                    {submission.category}
                  </p>
                  <p className="text-gray-700 mb-4 leading-relaxed">{submission.description}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-amber-600">
                    <p className="text-sm text-gray-700"><strong>Benefits:</strong> {submission.useCase}</p>
                  </div>
                  <p className="text-xs text-gray-500">Submitted by <span className="font-semibold text-gray-700">{submission.submittedBy}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'submit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Submit an AI Use Case</h1>
            <p className="text-gray-600">Share your innovative idea with the law student community</p>
          </div>

          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setView('browse')}
              className="px-6 py-3 bg-white border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition font-semibold"
            >
              Browse
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-amber-600">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.submittedBy}
                onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Use Case Title</label>
              <input
                type="text"
                placeholder="e.g., Contract Review Automation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
              <textarea
                placeholder="Describe the AI use case in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition resize-none"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-2">How It Benefits Legal Practice</label>
              <textarea
                placeholder="Explain the practical benefits and outcomes..."
                value={formData.useCase}
                onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-amber-600 text-white py-4 rounded-lg hover:bg-amber-700 transition font-bold text-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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