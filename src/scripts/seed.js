require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const seedBooks = [
  {
    title: 'পথের পাঁচালী',
    author: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়',
    category: 'Fiction',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    description: 'গ্রাম্য বাংলার অপূর্ব নিসর্গ আর অপু-দুর্গার শৈশবের চিরন্তন আখ্যান। বাংলা সাহিত্যের অন্যতম কালজয়ী উপন্যাস।',
    totalCopies: 5,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
  {
    title: 'চাঁদের পাহাড়',
    author: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়',
    category: 'Fiction',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    description: 'আফ্রিকার গহীন অরণ্যে শঙ্কর আর আলভারেজের রোমাঞ্চকর হীরক খনি আবিষ্কার ও বুনিপের গল্প।',
    totalCopies: 4,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
  {
    title: 'কালের সংক্ষিপ্ত ইতিহাস',
    author: 'স্টিফেন হকিং',
    category: 'Science',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    description: 'মহাবিশ্বের উৎপত্তি, কৃষ্ণগহ্বর, স্থান-কাল এবং আধুনিক পদার্থবিজ্ঞানের জটিল তত্ত্বের প্রাঞ্জল উপস্থাপন।',
    totalCopies: 6,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
  {
    title: 'কসমস',
    author: 'কার্ল সেগান',
    category: 'Science',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    description: 'মানব সভ্যতার মহাজাগতিক অভিযাত্রা ও মহাশূন্যের রহস্য উদঘাটনের অসাধারণ বৈজ্ঞানিক দলিল।',
    totalCopies: 3,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
  {
    title: 'একাত্তরের দিনগুলি',
    author: 'জাহানারা ইমাম',
    category: 'History',
    image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
    description: '১৯৭১ সালের মুক্তিযুদ্ধ চলাকালীন অবরুদ্ধ ঢাকার বাস্তব চিত্র ও এক শহিদ জননীর মর্মস্পর্শী ডায়েরি।',
    totalCopies: 7,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
  {
    title: 'টুনটুনির বই',
    author: 'উপেন্দ্রকিশোর রায়চৌধুরী',
    category: 'Kids',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80',
    description: 'ছোটদের চিরকালের প্রিয় দুষ্টু-মিষ্টি টুনটুনি আর রাজামশায়ের মজার মজার সব লোকগাথা ও রূপকথা।',
    totalCopies: 5,
    userEmail: 'admin@boighuri.com',
    userName: 'বইঘুরি লাইব্রেরি',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 MongoDB Connected for Seeding...');

    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(seedBooks);
      console.log('✅ সফলভাবে প্রাথমিক বইগুলো ডাটাবেসে সিড করা হয়েছে!');
    } else {
      console.log(`ℹ️ ডাটাবেসে ইতিমধ্যে ${count}টি বই সংরক্ষিত রয়েছে।`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ সিডিংয়ে ত্রুটি:', error.message);
    process.exit(1);
  }
};

seedDB();
