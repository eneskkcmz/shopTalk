const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
// Serve static files from public/uploads so frontend can access images
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to read/write DB
const getDb = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Helper to check if post is active (within 1 hour)
const isPostActive = (timestamp) => {
    const oneHour = 1000 * 60 * 60;
    return Date.now() - timestamp < oneHour;
};

// GET /api/feed - Only active posts
app.get('/api/feed', (req, res) => {
    const { category, userId } = req.query;
    const db = getDb();
    
    let activePosts = db.posts
        .filter(p => isPostActive(p.timestamp))
        .map(p => {
            const user = db.users.find(u => u.id === p.userId);
            // Safety check for comments array
            const commentCount = (db.comments || []).filter(c => c.postId === p.id).length;
            
            // Check if requesting user has voted
            let userVote = null;
            if (userId && db.votes) {
                const vote = db.votes.find(v => v.postId === p.id && v.userId === parseInt(userId));
                if (vote) userVote = vote.type;
            }

            return { ...p, user, commentCount, userVote };
        });

    if (category && category !== 'Hepsi') {
        activePosts = activePosts.filter(p => p.category === category);
    }
        
    activePosts = activePosts.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json(activePosts);
});

// GET /api/hall-of-fame - specific endpoint for top expired posts
app.get('/api/hall-of-fame', (req, res) => {
    const db = getDb();
    
    // Filter for expired posts (older than 1 hour)
    const expiredPosts = db.posts
        .filter(p => !isPostActive(p.timestamp))
        .map(p => {
            const user = db.users.find(u => u.id === p.userId);
            return { ...p, user };
        });

    // Sort by net score (likes - dislikes) or just likes
    const bestPosts = expiredPosts
        .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
        .slice(0, 20); // Top 20
    
    res.json(bestPosts);
});

// GET /api/users/search - Search users by name
app.get('/api/users/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const db = getDb();
    const results = db.users.filter(u => 
        u.name.toLowerCase().includes(q.toLowerCase())
    );
    res.json(results);
});

// GET /api/users - Get all users (for development/switcher)
app.get('/api/users', (req, res) => {
    const db = getDb();
    // Return just the user info, not posts
    res.json(db.users);
});

// GET /api/users/:id - User profile with all posts
app.get('/api/users/:id', (req, res) => {
    const db = getDb();
    const userId = parseInt(req.params.id);
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const userPosts = db.posts
        .filter(p => p.userId === userId)
        .map(p => ({
            ...p,
            isActive: isPostActive(p.timestamp),
            commentCount: (db.comments || []).filter(c => c.postId === p.id).length,
            // Check vote status
            userVote: (db.votes || []).find(v => v.postId === p.id && v.userId === userId) ? 
                      (db.votes.find(v => v.postId === p.id && v.userId === userId).type) : null
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

    res.json({ user, posts: userPosts });
});

// POST /api/posts - Create new post with file upload
app.post('/api/posts', upload.single('image'), (req, res) => {
    const { userId, description, category } = req.body;
    
    if (!req.file || !userId) {
        return res.status(400).json({ error: "Missing image or userId" });
    }

    // Construct public URL for the image
    // Note: In production, this would be a full URL or relative path handled by frontend
    const imageUrl = `/uploads/${req.file.filename}`;

    const db = getDb();
    const newPost = {
        id: db.posts.length > 0 ? Math.max(...db.posts.map(p => p.id)) + 1 : 1,
        userId: parseInt(userId),
        imageUrl,
        description: description || "",
        category: category || "Diğer",
        timestamp: Date.now(),
        likes: 0,
        dislikes: 0
    };

    db.posts.push(newPost);
    saveDb(db);

    res.status(201).json(newPost);
});

// POST /api/vote - Vote on a post
app.post('/api/vote', (req, res) => {
    const { postId, userId, type } = req.body;
    const db = getDb();
    
    // Ensure votes array exists
    if (!db.votes) {
        db.votes = [];
    }

    const postIndex = db.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        return res.status(404).json({ error: "Post not found" });
    }

    // Check if user has already voted
    const existingVoteIndex = db.votes.findIndex(v => v.postId === postId && v.userId === userId);
    const existingVote = existingVoteIndex !== -1 ? db.votes[existingVoteIndex] : null;

    if (existingVote) {
        if (existingVote.type === type) {
            // User clicked same vote button -> Remove vote (Toggle off)
            db.votes.splice(existingVoteIndex, 1);
            if (type === 'like') db.posts[postIndex].likes = Math.max(0, db.posts[postIndex].likes - 1);
            if (type === 'dislike') db.posts[postIndex].dislikes = Math.max(0, db.posts[postIndex].dislikes - 1);
            
            saveDb(db);
            return res.json({ ...db.posts[postIndex], userVote: null });
        } else {
            // User changed vote (e.g. from like to dislike)
            // Remove old impact
            if (existingVote.type === 'like') db.posts[postIndex].likes = Math.max(0, db.posts[postIndex].likes - 1);
            if (existingVote.type === 'dislike') db.posts[postIndex].dislikes = Math.max(0, db.posts[postIndex].dislikes - 1);
            
            // Apply new impact
            if (type === 'like') db.posts[postIndex].likes++;
            if (type === 'dislike') db.posts[postIndex].dislikes++;

            // Update vote record
            db.votes[existingVoteIndex].type = type;
            
            saveDb(db);
            return res.json({ ...db.posts[postIndex], userVote: type });
        }
    } else {
        // New vote
        if (type === 'like') db.posts[postIndex].likes++;
        else if (type === 'dislike') db.posts[postIndex].dislikes++;
        else return res.status(400).json({ error: "Invalid vote type" });

        db.votes.push({ userId, postId, type });
        
        saveDb(db);
        return res.json({ ...db.posts[postIndex], userVote: type });
    }
});

// POST /api/hasVoted - Check if user voted on post
app.post('/api/hasVoted', (req, res) => {
    const { postId, userId } = req.body;
    const db = getDb();
    
    if (!db.votes) return res.json({ hasVoted: false, type: null });

    const vote = db.votes.find(v => v.postId === postId && v.userId === userId);
    
    if (vote) {
        res.json({ hasVoted: true, type: vote.type });
    } else {
        res.json({ hasVoted: false, type: null });
    }
});


// GET /api/posts/:id/comments - Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);
    const db = getDb();

    // Safety check: ensure comments array exists
    if (!db.comments) {
        db.comments = [];
    }

    // Check if post exists - return 200 OK with empty array if post has no comments yet
    const postExists = db.posts.some(p => p.id === postId);
    if (!postExists) {
        // Option 1: Return 404 if post doesn't exist
        // return res.status(404).json({ error: "Post not found" });
        
        // Option 2 (Better for UI): Return empty array. 
        // The UI likely just wants to show comments, and if post is missing or has none, [] works best.
        return res.json([]); 
    }

    const comments = db.comments
        .filter(c => c.postId === postId)
        .map(c => {
            const user = db.users.find(u => u.id === c.userId);
            return { ...c, user };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
        
    res.json(comments);
});

// POST /api/posts/:id/comments - Add a comment to a post
app.post('/api/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);
    const { userId, text } = req.body;
    const db = getDb();
    
    // Safety check: ensure comments array exists
    if (!db.comments) {
        db.comments = [];
    }

    // NEW: Check if user exists (Optional but good practice)
    const user = db.users.find(u => u.id === parseInt(userId));
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const newComment = {
        id: db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) + 1 : 1,
        postId,
        userId: parseInt(userId),
        text,
        timestamp: Date.now()
    };
    
    db.comments.push(newComment);
    saveDb(db);
    
    // Return comment with user info
    res.json({ ...newComment, user });
});


// Mock Data Pools
const MOCK_IMAGES = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1593030761757-71bd90dbe3e4?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1617137968427-85924c809a29?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1548246713-1b43f9a91e52?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1550614000-4b9519e02d48?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop"
];

const MOCK_DESCRIPTIONS = [
    "Bugünkü kombinim nasıl?",
    "Yaz için bu renkler uygun mu?",
    "Ofis şıklığı diye buna derim!",
    "Vintage ceketimi çok seviyorum.",
    "Sokak modası denemeleri.",
    "Bu ayakkabılarla ne giyilir?",
    "Hafta sonu rahatlığı.",
    "Düğün için bu elbise fazla mı?",
    "Spor şıklık.",
    "Minimalist tarz.",
    "Renk uyumu hakkında ne düşünüyorsunuz?",
    "Yeni sezon parçaları denedim."
];

const MOCK_CATEGORIES = ["Sokak Modası", "Ofis", "Vintage", "Spor", "Özel Gün", "Diğer"];


const MOCK_COMMENTS = [
    "Harika görünüyorsun!",
    "Bunu nereden aldın?",
    "Renkler çok uyumlu olmuş.",
    "Bence biraz daha farklı kombinlenebilirdi.",
    "Bayıldım! 😍",
    "Çok şık.",
    "Bu tarz sana çok yakışıyor.",
    "Link var mı?",
    "Fiyatı nedir?",
    "Ben pek beğenmedim maalesef.",
    "Mükemmel uyum.",
    "Ayakkabılar efsane.",
    "Saçınla çok güzel durmuş.",
    "Biraz daha aksesuar eklenebilir.",
    "Tam benlik!"
];

// Helper to generate random posts
const generateRandomPosts = (count = 5) => {
    const db = getDb();
    
    // Safety check: ensure users exist
    if (!db.users || db.users.length === 0) return;

    // Safety check: ensure comments array exists
    if (!db.comments) {
        db.comments = [];
    }

    console.log(`[Auto-Generator] Creating ${count} new posts...`);
    const newPosts = [];
    const newComments = [];
    
    for (let i = 0; i < count; i++) {
        const randomUser = db.users[Math.floor(Math.random() * db.users.length)];
        const randomImage = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
        const randomDesc = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
        const randomCategory = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)];
        
        // Randomly assign some initial likes/dislikes
        const initialLikes = Math.floor(Math.random() * 20);
        const initialDislikes = Math.floor(Math.random() * 5);

        const postId = (db.posts.length > 0 ? Math.max(...db.posts.map(p => p.id)) + 1 : 1) + i;

        const newPost = {
            id: postId,
            userId: randomUser.id,
            imageUrl: randomImage,
            description: randomDesc,
            category: randomCategory,
            timestamp: Date.now(), // Fresh timestamp
            likes: initialLikes,
            dislikes: initialDislikes
        };
        newPosts.push(newPost);

        // Generate random comments for this post
        const commentCount = Math.floor(Math.random() * 4); // 0 to 3 comments per post
        for (let j = 0; j < commentCount; j++) {
            const commentUser = db.users[Math.floor(Math.random() * db.users.length)];
            const commentText = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
            
            const newComment = {
                id: (db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) + 1 : 1) + newComments.length + j,
                postId: postId,
                userId: commentUser.id,
                text: commentText,
                timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 10) // Random time within last 10 mins
            };
            newComments.push(newComment);
        }
    }

    db.posts.push(...newPosts);
    db.comments.push(...newComments);
    saveDb(db);
    console.log(`[Auto-Generator] Successfully added ${count} posts and ${newComments.length} comments.`);
};

// Helper to seed comments to existing active posts (run on startup)
const seedActivePostComments = () => {
    const db = getDb();
    if (!db.posts) return;
    
    // Safety check: ensure comments array exists
    if (!db.comments) {
        db.comments = [];
    }

    // Find active posts that have few or no comments
    const activePosts = db.posts.filter(p => isPostActive(p.timestamp));
    let addedCount = 0;

    console.log(`[Auto-Commenter] Checking ${activePosts.length} active posts for comments...`);

    activePosts.forEach(post => {
        // Count existing comments for this post
        const existingComments = db.comments.filter(c => c.postId === post.id).length;
        
        // If it has fewer than 3 comments, add some more
        if (existingComments < 3) {
            const commentsNeeded = Math.floor(Math.random() * 3) + 1; // Add 1-3 comments
            
            for (let j = 0; j < commentsNeeded; j++) {
                const commentUser = db.users[Math.floor(Math.random() * db.users.length)];
                const commentText = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
                
                // Ensure unique ID
                const currentMaxId = db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) : 0;
                
                const newComment = {
                    id: currentMaxId + 1,
                    postId: post.id,
                    userId: commentUser.id,
                    text: commentText,
                    timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 30) // Random time in last 30 mins
                };
                
                db.comments.push(newComment);
                addedCount++;
            }
        }
    });

    if (addedCount > 0) {
        saveDb(db);
        console.log(`[Auto-Commenter] Added ${addedCount} comments to active posts.`);
    }
};

// Start the generator
// Run immediately on server start to ensure content
// Then run every 60 minutes (3600000 ms) to keep feed alive
const GENERATOR_INTERVAL = 60 * 60 * 1000; 
setTimeout(() => {
    generateRandomPosts(4);
    seedActivePostComments(); // Also seed comments for existing active posts
}, 2000); // Wait 2s after start
setInterval(() => generateRandomPosts(4), GENERATOR_INTERVAL); // Create 4 posts every hour

app.listen(port, () => {
    console.log(`Wear Vote Server running at http://localhost:${port}`);
});
