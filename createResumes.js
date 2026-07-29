const { sequelize, User, Resume } = require('./models');

async function run() {
  await sequelize.sync();
  const user = await User.findOne({ where: { email: 'tanushree20@gmail.com' } });

  await Resume.create({
    title: 'Full Stack Intern',
    summary: 'Built REST APIs with Node, Express and MySQL.',
    userId: user.id,
  });

  await Resume.create({
    title: 'AI ML Student Portfolio',
    summary: 'B.Tech AI and ML student building full stack projects.',
    userId: user.id,
  });

  console.log('Saved 2 resumes');

  const resumes = await Resume.findAll({ where: { userId: user.id } });
  console.log('This user has', resumes.length, 'resumes:');
  resumes.forEach(function (r) {
    console.log(' -', r.title);
  });

  process.exit();
}

run();