import { useState, useEffect } from 'react';

function DailyDeclarations() {
  const declarations = [
    "The Lord is my shepherd; I shall not want. (Psalm 23:1)",
    "No weapon formed against me shall prosper. (Isaiah 54:17)",
    "I can do all things through Christ who strengthens me. (Philippians 4:13)",
    "The Lord is my light and my salvation; whom shall I fear? (Psalm 27:1)",
    "For I know the plans I have for you, declares the Lord. (Jeremiah 29:11)",
    "Be strong and courageous; do not be afraid. (Joshua 1:9)",
    "The peace of God, which transcends all understanding, will guard your hearts. (Philippians 4:7)",
    "Trust in the Lord with all your heart. (Proverbs 3:5)",
    "The Lord is faithful, who will establish you. (2 Thessalonians 3:3)",
    "My God will meet all your needs according to the riches of His glory. (Philippians 4:19)",
    "The Lord is my rock, my fortress and my deliverer. (Psalm 18:2)",
    "Cast all your anxiety on Him because He cares for you. (1 Peter 5:7)",
    "The Lord is gracious and compassionate, slow to anger and rich in love. (Psalm 145:8)",
    "In all things God works for the good of those who love Him. (Romans 8:28)",
    "The Lord is near to all who call on Him. (Psalm 145:18)",
    "Be still, and know that I am God. (Psalm 46:10)",
    "The Lord will fight for you; you need only to be still. (Exodus 14:14)",
    "I am the vine; you are the branches. (John 15:5)",
    "The Lord is my strength and my shield. (Psalm 28:7)",
    "Delight yourself in the Lord, and He will give you the desires of your heart. (Psalm 37:4)",
    "The Lord is with you wherever you go. (Joshua 1:9)",
    "My grace is sufficient for you, for my power is made perfect in weakness. (2 Corinthians 12:9)",
    "The Lord bless you and keep you. (Numbers 6:24)",
    "Seek first His kingdom and His righteousness. (Matthew 6:33)",
    "The Lord is my salvation. (Isaiah 12:2)"
  ];

  const [currentDeclaration, setCurrentDeclaration] = useState('');

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % declarations.length;
    setCurrentDeclaration(declarations[index]);
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px', backgroundColor: '#fff8dc' }}>
      <h3>Daily Declaration - Sister Nikki Style</h3>
      <p style={{ fontSize: '18px', fontStyle: 'italic' }}>{currentDeclaration}</p>
      <p style={{ fontSize: '12px', color: '#666' }}>Rotates daily. All glory to Yeshua.</p>
    </div>
  );
}

export default DailyDeclarations;