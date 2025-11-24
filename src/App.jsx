// src/components/TinyLink.jsx
import React, { useState, useEffect } from 'react';
import { Copy, Trash2, ExternalLink, BarChart3, Clock, MousePointerClick, Link2 } from 'lucide-react';
import API_BASE from './api/api';

/**
 * TinyLink (absolute-link mode)
 * - Shows /code visually but uses absoluteUrl for href, copy, and open actions.
 */

export default function TinyLink() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    try {
      const res = await fetch(`${API_BASE}/api/links`);
      if (!res.ok) {
        console.error('Failed to fetch links', res.statusText);
        setError('Failed to fetch links from backend.');
        return;
      }
      const data = await res.json();
      const normalized = data.map(l => ({ ...l, absoluteUrl: l.shortUrl || `${API_BASE}/${l.code}` }));
      setLinks(normalized);
    } catch (err) {
      console.error('fetchLinks err', err);
      setError('Network error while fetching links.');
    }
  }

  async function createLink() {
    setError(''); setSuccess('');
    if (!url) { setError('Please enter a URL'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: url })
      });

      let data = null;
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        const msg = data?.error || res.statusText || 'Failed to create link';
        setError(`Server error (${res.status}): ${msg}`);
        setLoading(false);
        return;
      }

      const absoluteUrl = data?.shortUrl || `${API_BASE}/${data.code}`;
      const displayPath = data?.shortPath || `/${data.code}`;

      // show absolute link in success (so user can copy full link at glance),
      // but still display the short path in UI list.
      setSuccess(absoluteUrl);
      setUrl('');
      setLinks(prev => [{ ...data, absoluteUrl }, ...prev]);
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      console.error('createLink err', err);
      setError('Network error. Check backend and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteLink(code) {
    if (!window.confirm(`Delete link /${code}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/links/${code}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Failed to delete link');
        return;
      }
      setLinks(prev => prev.filter(l => l.code !== code));
      setSuccess(`Deleted /${code}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('delete err', err);
      setError('Failed to delete link.');
    }
  }

  async function copyToClipboard(absoluteUrl) {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      // find code by url to show copied indicator (optional)
      const code = absoluteUrl.split('/').pop();
      setCopied(code);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('copy err', err);
      setError('Unable to copy to clipboard');
    }
  }

  function openRedirect(absoluteUrl) {
    // open the backend absolute URL so redirect goes through the backend
    window.open(absoluteUrl, '_blank', 'noopener');
  }

  function formatDate(dt) {
    if (!dt) return 'Never';
    return new Date(dt).toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link2 className="w-12 h-12 text-indigo-600" />
            <h1 className="text-5xl font-bold text-gray-800">TinyLink</h1>
          </div>
          <p className="text-gray-600 text-lg">Shorten your URLs instantly</p>
        </div>

        {/* Create */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Long URL *</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded"><p className="text-red-700 text-sm font-medium">{error}</p></div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><p className="text-green-700 text-sm font-medium break-all">{success}</p></div>}

            <button
              onClick={createLink}
              disabled={loading || !url}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>) : (<><Link2 className="w-5 h-5" />Shorten URL</>)}
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Links</h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">{links.length}</span>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No links yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map(link => (
                <div key={link.code} className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Show path visually */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 px-4 py-2 rounded-lg">
                          <span className="text-indigo-700 font-bold text-lg break-all">/{link.code}</span>
                        </div>

                        <button onClick={() => copyToClipboard(link.absoluteUrl)} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Copy to clipboard">
                          {copied === link.code ? <span className="text-green-600 text-sm font-medium">Copied!</span> : <Copy className="w-5 h-5 text-gray-600" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={link.target} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-indigo-600 truncate text-sm break-all">{link.target}</a>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MousePointerClick className="w-4 h-4" />
                          <span className="font-semibold">{link.totalClicks}</span>
                          <span>clicks</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Created: {formatDate(link.createdAt)}</span>
                        </div>
                        {link.lastClickedAt && <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /><span>Last clicked: {formatDate(link.lastClickedAt)}</span></div>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => openRedirect(link.absoluteUrl)} className="p-2 hover:bg-indigo-50 rounded-lg transition" title="Visit link"><ExternalLink className="w-5 h-5 text-indigo-600" /></button>
                      <button onClick={() => deleteLink(link.code)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Delete link"><Trash2 className="w-5 h-5 text-red-600" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        <div className="text-center mt-8 text-gray-500 text-sm"><p>TinyLink - Free URL Shortener</p></div>
      </div>
    </div>
  );
}
