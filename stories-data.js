// ============================================
// VOOMCOMIX — STORIES DATA STORE v2
// Ab cover image support hai!
// ============================================

const VOOMCOMIX_DATA = {
  stories: [
    {
      id: "story-001",
      title: "The Devil Wears a Crown",
      author: "VoomComix",
      genre: "Romance · Drama",
      tags: ["Romance", "Dark", "Thriller"],
      status: "ongoing",
      language: "English",
      cover: "", // image path jaise "covers/story1.jpg"
      coverEmoji: "📕",
      coverColor: "linear-gradient(135deg,#1a0a0a,#2d1515)",
      description: "A powerful CEO, a dangerous secret, and a love that could destroy everything. When Aanya accepts a mysterious contract, she doesn't know she's signing away her heart.",
      totalChapters: 3,
      views: "2.8K",
      rating: 4.7,
      dateAdded: "2024-01-15",
      chapters: [
        { id: 1, title: "The Contract", date: "2024-01-15", wordCount: 1820, content: "Chapter 1 content goes here.\n\nWrite your full chapter here. Each new line becomes a new paragraph.\n\nThis is how your readers will see it." },
        { id: 2, title: "First Meeting", date: "2024-01-22", wordCount: 2100, content: "Chapter 2 content goes here." },
        { id: 3, title: "The Truth Unveiled", date: "2024-02-01", wordCount: 1950, content: "Chapter 3 content goes here." }
      ]
    },
    {
      id: "story-002",
      title: "Veyran: The Dark Within",
      author: "VoomComix",
      genre: "Fantasy · Action",
      tags: ["Fantasy", "Action", "Magic"],
      status: "ongoing",
      language: "English",
      cover: "",
      coverEmoji: "⚔️",
      coverColor: "linear-gradient(135deg,#0a0a1a,#1a0d2e)",
      description: "In a world where darkness is a weapon, Veyran — the last shadow-mage — must choose between saving his people or embracing the monster he was born to become.",
      totalChapters: 21,
      views: "10.3K",
      rating: 4.9,
      isTrending: true,
      dateAdded: "2023-11-10",
      chapters: [
        { id: 1, title: "Awakening", date: "2023-11-10", wordCount: 2500, content: "Chapter 1 content here." },
        { id: 2, title: "The Shadow Calls", date: "2023-11-17", wordCount: 2800, content: "Chapter 2 content here." },
        { id: 3, title: "First Blood", date: "2023-11-24", wordCount: 3100, content: "Chapter 3 content here." }
      ]
    },
    {
      id: "story-003",
      title: "The Collateral",
      author: "VoomComix",
      genre: "Thriller · Mystery",
      tags: ["Thriller", "Mystery", "Dark"],
      status: "ongoing",
      language: "Hindi",
      cover: "",
      coverEmoji: "🔥",
      coverColor: "linear-gradient(135deg,#1a0800,#2a1500)",
      description: "Ek crime thriller jisme har sach ke peeche ek aur jhooth chhupta hai. Vikram ke liye yeh sirf ek case nahi — yeh uski zindagi ka sabse bada imtehaan hai.",
      totalChapters: 3,
      views: "2.7K",
      rating: 4.5,
      dateAdded: "2024-02-10",
      chapters: [
        { id: 1, title: "Pehli Raat", date: "2024-02-10", wordCount: 1700, content: "Chapter 1 content here." },
        { id: 2, title: "Laash", date: "2024-02-17", wordCount: 1900, content: "Chapter 2 content here." },
        { id: 3, title: "Raaz", date: "2024-02-24", wordCount: 2200, content: "Chapter 3 content here." }
      ]
    }
  ]
};

function saveData() {
  localStorage.setItem('voomcomix_stories', JSON.stringify(VOOMCOMIX_DATA.stories));
}
function loadData() {
  const saved = localStorage.getItem('voomcomix_stories');
  if (saved) VOOMCOMIX_DATA.stories = JSON.parse(saved);
  return VOOMCOMIX_DATA.stories;
}

// Cover helper — image ya emoji+color fallback
function getCoverHTML(s, h='240px') {
  if(s.cover && s.cover.trim()) {
    return `<img src="${s.cover}" alt="${s.title}" style="width:100%;height:${h};object-fit:cover;display:block;"/>`;
  }
  return `<div style="width:100%;height:${h};background:${s.coverColor};display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${s.coverEmoji||'📖'}</div>`;
}
