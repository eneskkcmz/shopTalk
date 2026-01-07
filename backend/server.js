const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and integrate Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../public/uploads');

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

// --- Socket.io Logic ---
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User identification
    socket.on('identify', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User identified: ${userId} -> ${socket.id}`);
    });

    // Send Message
    socket.on('send_message', (data) => {
        const { senderId, receiverId, text } = data;
        const db = getDb();

        if (!db.messages) {
            db.messages = [];
        }

        const newMessage = {
            id: Date.now(),
            senderId,
            receiverId,
            text,
            timestamp: Date.now(),
            isRead: false
        };

        db.messages.push(newMessage);
        saveDb(db);

        // Emit to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive_message', newMessage);
        }
        
        // Emit back to sender (to update their UI with confirmed message)
        socket.emit('message_sent', newMessage);

        // --- AUTO-REPLY LOGIC (Simulate conversation) ---
        // If the SENDER is the main user (Enes, ID 1), then the RECEIVER should "reply"
        // after a short random delay.
        if (senderId === 1) { // Assuming Enes is ID 1
            setTimeout(() => {
                const db = getDb(); // Re-read DB
                const replyText = [
                    "Tamamdır, anlaştık.",
                    "Harika, çok sevindim!",
                    "Sonra konuşalım mı?",
                    "Buna bayıldım!",
                    "Teşekkürler :)",
                    "Aynen öyle düşünüyorum.",
                    "Hahaha çok iyi!",
                    "Görüşürüz.",
                    "Belki daha sonra.",
                    "Süper fikir."
                ][Math.floor(Math.random() * 10)];

                const replyMessage = {
                    id: Date.now(),
                    senderId: receiverId, // The person Enes messaged is now replying
                    receiverId: senderId, // Enes is receiving
                    text: replyText,
                    timestamp: Date.now(),
                    isRead: false
                };

                db.messages.push(replyMessage);
                saveDb(db);

                // Emit to Enes (he is online since he just sent a message)
                socket.emit('receive_message', replyMessage);
                console.log(`[Auto-Reply] User ${receiverId} replied to Enes: "${replyText}"`);

            }, Math.floor(Math.random() * 5000) + 2000); // 2-7 seconds delay
        }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
        const { senderId, receiverId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
             io.to(receiverSocketId).emit('user_typing', { senderId });
        }
    });

    socket.on('stop_typing', (data) => {
        const { senderId, receiverId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
         if (receiverSocketId) {
             io.to(receiverSocketId).emit('user_stop_typing', { senderId });
        }
    });

    socket.on('disconnect', () => {
        // Remove user from map
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Helper to check if post is active (within 1 hour)
const isPostActive = (timestamp) => {
    const oneHour = 1000 * 60 * 60;
    return Date.now() - timestamp < oneHour;
};

// GET /api/messages/:userId/:otherId - Get conversation history
app.get('/api/messages/:userId/:otherId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const otherId = parseInt(req.params.otherId);
    const db = getDb();
    
    if (!db.messages) return res.json([]);

    const conversation = db.messages.filter(m => 
        (m.senderId === userId && m.receiverId === otherId) ||
        (m.senderId === otherId && m.receiverId === userId)
    ).sort((a, b) => a.timestamp - b.timestamp);

    res.json(conversation);
});

// GET /api/conversations/:userId - Get list of conversations
app.get('/api/conversations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const db = getDb();
    
    if (!db.messages) return res.json([]);

    // Find all unique users communicated with
    const conversationPartners = new Set();
    db.messages.forEach(m => {
        if (m.senderId === userId) conversationPartners.add(m.receiverId);
        if (m.receiverId === userId) conversationPartners.add(m.senderId);
    });

    const conversations = Array.from(conversationPartners).map(partnerId => {
        const partner = db.users.find(u => u.id === partnerId);
        // Find last message
        const messages = db.messages
            .filter(m => (m.senderId === userId && m.receiverId === partnerId) || (m.senderId === partnerId && m.receiverId === userId))
            .sort((a, b) => b.timestamp - a.timestamp);

        const lastMessage = messages[0];
        
        // Count unread messages where I am the receiver
        const unreadCount = messages.filter(m => m.receiverId === userId && !m.isRead).length;
            
        return {
            user: partner,
            lastMessage,
            unreadCount
        };
    }).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

    res.json(conversations);
});

// POST /api/messages/mark-read - Mark messages as read
app.post('/api/messages/mark-read', (req, res) => {
    const { userId, otherId } = req.body; // userId is "me" (receiver), otherId is "sender"
    const db = getDb();

    if (!db.messages) return res.json({ success: true });

    let updated = false;
    db.messages.forEach(m => {
        if (m.senderId === parseInt(otherId) && m.receiverId === parseInt(userId) && !m.isRead) {
            m.isRead = true;
            updated = true;
        }
    });

    if (updated) {
        saveDb(db);
    }

    res.json({ success: true });
});

// GET /api/feed - Only active posts
app.get('/api/feed', (req, res) => {
    const { category, userId, feedType } = req.query; // feedType: 'foryou' | 'following'
    const db = getDb();
    
    // Default to all active posts
    let activePosts = db.posts.filter(p => isPostActive(p.timestamp));

    // Filter by "Following" if requested
    if (feedType === 'following' && userId) {
        const requesterId = parseInt(userId);
        const follows = db.follows || [];
        // Get list of IDs the user follows
        const followedIds = follows
            .filter(f => f.followerId === requesterId)
            .map(f => f.followingId);
        
        // Include posts from followed users OR the user themselves
        activePosts = activePosts.filter(p => followedIds.includes(p.userId) || p.userId === requesterId);
    }

    activePosts = activePosts.map(p => {
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
    
    // Get ALL posts that have some engagement (likes or dislikes)
    // We don't filter by active/inactive because we want to see the best of all time/recent
    // But we prioritize those with images
    const allPosts = db.posts.map(p => {
        const user = db.users.find(u => u.id === p.userId);
        return { ...p, user };
    });

    // Sort by engagement (likes - dislikes)
    // If scores are equal, prefer newer posts
    const bestPosts = allPosts
        .sort((a, b) => {
            const scoreA = (a.likes || 0) - (a.dislikes || 0);
            const scoreB = (b.likes || 0) - (b.dislikes || 0);
            
            if (scoreA !== scoreB) {
                return scoreB - scoreA; // Descending score
            }
            return b.timestamp - a.timestamp; // Tie-break with time
        })
        .slice(0, 10); // Top 10 only
    
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

    // Calculate dynamic follower/following counts
    const follows = db.follows || [];
    const followerCount = follows.filter(f => f.followingId === userId).length;
    const followingCount = follows.filter(f => f.followerId === userId).length;

    // Check if requesting user is following this profile
    let isFollowing = false;
    const requesterId = req.query.requesterId ? parseInt(req.query.requesterId) : null;
    if (requesterId) {
        isFollowing = follows.some(f => f.followerId === requesterId && f.followingId === userId);
    }

    // Override the static follower count with dynamic + static base (optional, but let's just use dynamic + base for realism or just dynamic)
    // For now, let's add the dynamic count to the static base to preserve the "mock" high numbers, 
    // or just return these as separate fields.
    // Let's return a "stats" object.
    
    // Actually, let's just update the user object we send back with these computed values.
    // We'll keep the static 'followers' from DB as a "base" and add real followers to it if we want, 
    // OR just use the real count. Since we just wiped DB, real count is 0. 
    // Let's stick to the static number for "simulation" feeling, BUT add a boolean 'isFollowing'.
    // Better yet: User the static number as a base, and add any NEW real followers.
    // Simplest approach for this prototype:
    // Return `isFollowing` flag.
    // Return `realFollowerCount` and `realFollowingCount`.
    
    res.json({ 
        user: { ...user, followers: user.followers + followerCount }, // Simple hack: add real followers to static base
        stats: {
            followers: user.followers + followerCount,
            following: 856 + followingCount // static base for following too
        },
        isFollowing,
        posts: userPosts 
    });
});

// POST /api/follow - Toggle follow status
app.post('/api/follow', (req, res) => {
    const { followerId, followingId } = req.body;
    const db = getDb();

    if (!db.follows) {
        db.follows = [];
    }

    const existingIndex = db.follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);

    if (existingIndex !== -1) {
        // Unfollow
        db.follows.splice(existingIndex, 1);
        saveDb(db);
        res.json({ isFollowing: false });
    } else {
        // Follow
        db.follows.push({ followerId, followingId, timestamp: Date.now() });
        saveDb(db);
        res.json({ isFollowing: true });
    }
});

    // POST /api/posts - Create new post with file upload
    app.post('/api/posts', upload.single('image'), (req, res) => {
    const { userId, description, category, location, mediaType, height, weight } = req.body;
    
    if (!req.file || !userId) {
        return res.status(400).json({ error: "Missing image or userId" });
    }


    // Construct public URL for the image
    // Note: In production, this would be a full URL or relative path handled by frontend
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Determine media type based on explicit field OR mimetype
    const detectedMediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const finalMediaType = mediaType || detectedMediaType;

    const db = getDb();
    const newPost = {
        id: db.posts.length > 0 ? Math.max(...db.posts.map(p => p.id)) + 1 : 1,
        userId: parseInt(userId),
        imageUrl,
        mediaType: finalMediaType,
        description: description || '',
        category: category || 'Diğer',
        location: location || '',
        timestamp: Date.now(),
        likes: 0,
        dislikes: 0,
        commentCount: 0,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null
    };

    db.posts.push(newPost);
    saveDb(db);
    
    // console.log('Created new post:', newPost);

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

const MOCK_LOCATIONS = [
    "Nişantaşı, İstanbul",
    "Karaköy, İstanbul",
    "Bebek, İstanbul",
    "Alsancak, İzmir",
    "Çankaya, Ankara",
    "Bağdat Caddesi, İstanbul",
    "Bodrum, Muğla",
    "Alaçatı, İzmir",
    "Kadıköy, İstanbul"
];

const MOCK_CATEGORIES = ["Sokak Modası", "Ofis", "Vintage", "Spor", "Özel Gün", "Diğer"];

const MOCK_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];


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
    
    // Select a random index to guarantee at least one video in this batch
    const guaranteedVideoIndex = Math.floor(Math.random() * count);

    for (let i = 0; i < count; i++) {
        const randomUser = db.users[Math.floor(Math.random() * db.users.length)];
        
        // Guarantee video at the selected index, otherwise 20% chance
        const isVideo = (i === guaranteedVideoIndex) || (Math.random() < 0.2);
        
        let randomImage, mediaType;
        
        if (isVideo) {
             randomImage = MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
             mediaType = 'video';
        } else {
             randomImage = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
             mediaType = 'image';
        }

        const randomDesc = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
        const randomCategory = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)];
        const randomLocation = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
        
        // Randomly assign some initial likes/dislikes
        const initialLikes = Math.floor(Math.random() * 20);
        const initialDislikes = Math.floor(Math.random() * 5);

        // Generate random Height (150-200) and Weight (45-100) with 80% probability
        let randomHeight = null;
        let randomWeight = null;
        
        if (Math.random() < 0.8) {
             randomHeight = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
             randomWeight = Math.floor(Math.random() * (100 - 45 + 1)) + 45;
        }

        const postId = (db.posts.length > 0 ? Math.max(...db.posts.map(p => p.id)) + 1 : 1) + i;

        const newPost = {
            id: postId,
            userId: randomUser.id,
            imageUrl: randomImage,
            mediaType: mediaType, 
            description: randomDesc,
            category: randomCategory,
            location: randomLocation,
            timestamp: Date.now(), // Fresh timestamp
            likes: initialLikes,
            dislikes: initialDislikes,
            height: randomHeight,
            weight: randomWeight
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

    // Emit event to all clients
    io.emit('new_posts_available', { count: newPosts.length });
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

// Helper to generate random messages to the main user (Enes Kocamaz - ID 1)
const generateRandomMessages = (count = 5) => {
    const db = getDb();
    const TARGET_USER_ID = 1; // Enes Kocamaz

    // Safety check
    if (!db.users || db.users.length === 0) return;
    if (!db.messages) db.messages = [];

    // Pick a random sender (not Enes)
    const potentialSenders = db.users.filter(u => u.id !== TARGET_USER_ID);
    if (potentialSenders.length === 0) return;

    let messagesAdded = 0;
    console.log(`[Auto-Message] Generating ${count} messages...`);

    for (let i = 0; i < count; i++) {
        const randomSender = potentialSenders[Math.floor(Math.random() * potentialSenders.length)];
        const randomText = [
            "Selam, naber?",
            "Son paylaştığın fotoğraf harika!",
            "Bu hafta sonu müsait misin?",
            "Kombinlerin çok iyi gidiyor.",
            "Şu ceketi nereden aldın?",
            "Merhaba!",
            "Takip ettim, geri döner misin?",
            "Fotoğraftaki mekan neresi?",
            "Çok tarz giyiniyorsun 👍",
            "Selam Enes, nasılsın?"
        ][Math.floor(Math.random() * 10)];

        const newMessage = {
            id: Date.now() + i,
            senderId: randomSender.id,
            receiverId: TARGET_USER_ID,
            text: randomText,
            timestamp: Date.now(),
            isRead: false
        };

        db.messages.push(newMessage);
        messagesAdded++;

        console.log(`[Auto-Message] New message from ${randomSender.name}: "${randomText}"`);

        // Emit to Enes if he is connected
        const receiverSocketId = connectedUsers.get(TARGET_USER_ID);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive_message', newMessage);
        }
    }

    if (messagesAdded > 0) {
        saveDb(db);
    }
};

// Helper to generate random interactions (Likes/Comments) for a specific user's posts
const generateRandomInteractions = (count = 5) => {
    const db = getDb();
    const TARGET_USER_ID = 1; // Enes Kocamaz

    if (!db.posts || db.posts.length === 0) return;
    if (!db.notifications) db.notifications = [];
    if (!db.votes) db.votes = []; // Ensure votes exist
    if (!db.comments) db.comments = []; // Ensure comments exist

    // Find active posts belonging to Enes
    const userPosts = db.posts.filter(p => p.userId === TARGET_USER_ID);
    
    if (userPosts.length === 0) return; // No active posts to interact with

    const potentialSenders = db.users.filter(u => u.id !== TARGET_USER_ID);
    if (potentialSenders.length === 0) return;

    let interactionsAdded = 0;
    console.log(`[Auto-Interaction] Generating ${count} interactions...`);

    for (let i = 0; i < count; i++) {
        // Pick a random post
        const targetPost = userPosts[Math.floor(Math.random() * userPosts.length)];
        
        // Pick a random sender (not Enes)
        const randomSender = potentialSenders[Math.floor(Math.random() * potentialSenders.length)];

        // Decide: Like (70%) or Comment (30%)
        const isLike = Math.random() > 0.3;
        const type = isLike ? 'like' : 'comment';
        
        let notificationText = '';
        let interactionSuccess = false;

        if (isLike) {
            // Add Like
            const hasVoted = db.votes.some(v => v.postId === targetPost.id && v.userId === randomSender.id);
            
            if (!hasVoted) {
                db.votes.push({ userId: randomSender.id, postId: targetPost.id, type: 'like' });
                // Find post in main array and update count
                const postIndex = db.posts.findIndex(p => p.id === targetPost.id);
                if (postIndex !== -1) {
                    db.posts[postIndex].likes++;
                }
                notificationText = `${randomSender.name} fotoğrafını beğendi.`;
                interactionSuccess = true;
            }
        } else {
            // Add Comment
            const commentText = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
            
            const newComment = {
                id: (db.comments.length > 0 ? Math.max(...db.comments.map(c => c.id)) : 0) + 1,
                postId: targetPost.id,
                userId: randomSender.id,
                text: commentText,
                timestamp: Date.now()
            };
            db.comments.push(newComment);
            notificationText = `${randomSender.name} yorum yaptı: "${commentText}"`;
            interactionSuccess = true;
        }

        if (interactionSuccess) {
            // Create Notification
            const newNotification = {
                id: Date.now() + i,
                userId: TARGET_USER_ID, // Receiver
                senderId: randomSender.id, // Actor
                type: type,
                postId: targetPost.id,
                text: notificationText,
                timestamp: Date.now(),
                isRead: false
            };

            db.notifications.push(newNotification);
            interactionsAdded++;

            console.log(`[Auto-Interaction] ${notificationText}`);

            // Emit to Enes
            const receiverSocketId = connectedUsers.get(TARGET_USER_ID);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new_notification', newNotification);
            }
        }
    }

    if (interactionsAdded > 0) {
        saveDb(db);
    }
};

// Helper to cleanup old messages and notifications
const cleanupOldData = () => {
    const db = getDb();
    let updated = false;

    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();

    // Cleanup old messages (older than 1 hour)
    if (db.messages && db.messages.length > 0) {
        const initialCount = db.messages.length;
        // Keep only messages from last hour
        db.messages = db.messages.filter(m => now - m.timestamp < ONE_HOUR);
        
        // However, we should probably keep at least the last few messages for conversations to not look empty immediately?
        // Requirement says "delete hourly", let's be strict but maybe keep very recent ones if needed.
        // For now, strict 1 hour rule.
        
        if (db.messages.length !== initialCount) {
             console.log(`[Cleanup] Removed ${initialCount - db.messages.length} old messages.`);
             updated = true;
        }
    }

    // Cleanup old notifications (older than 1 hour)
    if (db.notifications && db.notifications.length > 0) {
        const initialCount = db.notifications.length;
        db.notifications = db.notifications.filter(n => now - n.timestamp < ONE_HOUR);
        
        if (db.notifications.length !== initialCount) {
             console.log(`[Cleanup] Removed ${initialCount - db.notifications.length} old notifications.`);
             updated = true;
        }
    }
    
    // Also cleanup old posts that are way too old? (Hall of fame handles > 1 hour, maybe delete > 24 hours?)
    // Requirement was specifically about messages and notifications visuals being "too much".
    
    // Auto-reply to new messages sent by user (Enes)
    // If Enes sends a message, reply after a short delay
    // This logic needs to be in the send_message handler, not cleanup.
    // Moving on.

    if (updated) {
        saveDb(db);
        // We might want to emit an event to frontend to refresh, but frontend polls/gets realtime updates.
        // If we delete data, frontend might show old data until refresh.
        // For now, let's assume page refresh handles it or next fetch.
    }
};


// GET /api/notifications/:userId
app.get('/api/notifications/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const db = getDb();
    
    if (!db.notifications) return res.json([]);

    const notifications = db.notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
        
    // Enrich with sender info
    const enriched = notifications.map(n => {
        const sender = db.users.find(u => u.id === n.senderId);
        return { ...n, sender };
    });

    res.json(enriched);
});

// POST /api/notifications/mark-read
app.post('/api/notifications/mark-read', (req, res) => {
    const { userId } = req.body;
    const db = getDb();

    if (!db.notifications) return res.json({ success: true });

    let updated = false;
    db.notifications.forEach(n => {
        if (n.userId === parseInt(userId) && !n.isRead) {
            n.isRead = true;
            updated = true;
        }
    });

    if (updated) saveDb(db);
    res.json({ success: true });
});

// Start the generator
// Run immediately on server start to ensure content
// Then run every 60 minutes (3600000 ms) to keep feed alive
const GENERATOR_INTERVAL = 10 * 60 * 1000; // Normal: 10 minutes
// const MESSAGE_INTERVAL = 60 * 60 * 1000; // 1 hour
const MESSAGE_INTERVAL = 15 * 60 * 1000; // Slower: 15 minutes (approx 4 per hour)
const INTERACTION_INTERVAL = 6 * 60 * 1000; // Slower: 6 minutes (approx 10 per hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

setTimeout(() => {
    generateRandomPosts(4);
    seedActivePostComments(); 
    generateRandomMessages(4); // Initial message
    generateRandomInteractions(4); // Initial interaction
    cleanupOldData(); // Initial cleanup check
}, 2000); 

setInterval(() => generateRandomPosts(4), GENERATOR_INTERVAL); 
setInterval(() => generateRandomMessages(4), MESSAGE_INTERVAL); // Random message loop
setInterval(() => generateRandomInteractions(4), INTERACTION_INTERVAL); // Random interaction loop
setInterval(() => cleanupOldData(), CLEANUP_INTERVAL); // Hourly cleanup loop

server.listen(port, () => {
    console.log(`Wear Vote Server running at http://localhost:${port}`);
});
