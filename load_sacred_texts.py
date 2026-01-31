#!/usr/bin/env python3
"""
Sacred Texts Loader for Enoch AI
Downloads and prepares sacred texts for the True Council Of 33
"""
from pathlib import Path
import requests
import json

class SacredTextsLoader:
    def __init__(self, base_path="C:\\Temple\\data\\sacred-texts"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def download_kjv_bible(self):
        """Download KJV Bible from Project Gutenberg"""
        print("🕊️ Downloading KJV Bible...")

        url = "https://www.gutenberg.org/cache/epub/10/pg10.txt"
        response = requests.get(url)

        if response.status_code == 200:
            content = response.text
            # Remove Project Gutenberg headers/footers
            start_marker = "*** START OF THE PROJECT GUTENBERG EBOOK THE KING JAMES BIBLE ***"
            end_marker = "*** END OF THE PROJECT GUTENBERG EBOOK THE KING JAMES BIBLE ***"

            start_idx = content.find(start_marker)
            end_idx = content.find(end_marker)

            if start_idx != -1 and end_idx != -1:
                kjv_text = content[start_idx + len(start_marker):end_idx].strip()
            else:
                kjv_text = content

            kjv_path = self.base_path / "kjv_bible.txt"
            with open(kjv_path, 'w', encoding='utf-8') as f:
                f.write(kjv_text)

            print(f"✅ KJV Bible saved to {kjv_path}")
            return True
        else:
            print(f"❌ Failed to download KJV Bible: {response.status_code}")
            return False

    def download_book_of_enoch(self):
        """Download Book of Enoch (Ethiopic version)"""
        print("🕊️ Downloading Book of Enoch...")

        # Using alternative source
        url = "https://www.ccel.org/ccel/charles/1enoch/1enoch.txt"
        response = requests.get(url)

        if response.status_code == 200:
            content = response.text
            enoch_path = self.base_path / "book_of_enoch.txt"
            with open(enoch_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Book of Enoch saved to {enoch_path}")
            return True
        else:
            print(f"❌ Failed to download Book of Enoch: {response.status_code}")
            return False

    def download_apocrypha(self):
        """Download Apocrypha"""
        print("🕊️ Downloading Apocrypha...")

        # Using Project Gutenberg Apocrypha
        url = "https://www.gutenberg.org/cache/epub/8177/pg8177.txt"
        response = requests.get(url)

        if response.status_code == 200:
            content = response.text
            apocrypha_path = self.base_path / "apocrypha.txt"
            with open(apocrypha_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Apocrypha saved to {apocrypha_path}")
            return True
        else:
            print(f"❌ Failed to download Apocrypha: {response.status_code}")
            return False

    def download_gospel_of_thomas(self):
        """Download Gospel of Thomas"""
        print("🕊️ Downloading Gospel of Thomas...")

        # Using alternative source
        url = "https://www.ccel.org/g/gospel-thomas/text.txt"
        response = requests.get(url)

        if response.status_code == 200:
            content = response.text
            thomas_path = self.base_path / "gospel_of_thomas.txt"
            with open(thomas_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Gospel of Thomas saved to {thomas_path}")
            return True
        else:
            print(f"❌ Failed to download Gospel of Thomas: {response.status_code}")
            return False

    def create_sacred_index(self):
        """Create an index of all sacred texts"""
        print("🕊️ Creating sacred texts index...")

        sacred_files = [
            "kjv_bible.txt",
            "book_of_enoch.txt",
            "apocrypha.txt",
            "gospel_of_thomas.txt"
        ]

        index_data = {
            "sacred_texts": [],
            "total_files": 0,
            "description": "Sacred Texts Database for Enoch AI - True Council Of 33"
        }

        for filename in sacred_files:
            file_path = self.base_path / filename
            if file_path.exists():
                file_size = file_path.stat().st_size
                index_data["sacred_texts"].append({
                    "filename": filename,
                    "path": str(file_path),
                    "size_bytes": file_size,
                    "description": self._get_description(filename)
                })
                index_data["total_files"] += 1

        index_path = self.base_path / "sacred_index.json"
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

        print(f"✅ Sacred index created at {index_path}")
        return index_data

    def _get_description(self, filename):
        """Get description for sacred text file"""
        descriptions = {
            "kjv_bible.txt": "King James Version Bible - Primary sacred text",
            "book_of_enoch.txt": "Book of Enoch (Ethiopic) - Prophetic wisdom",
            "apocrypha.txt": "Apocryphal books - Additional sacred writings",
            "gospel_of_thomas.txt": "Gospel of Thomas - Sayings of Jesus"
        }
        return descriptions.get(filename, "Sacred text")

    def load_all_sacred_texts(self):
        """Download all sacred texts and create index"""
        print("🕊️ ENOCH: Loading sacred texts database...")
        print("📖 Under the Blood of Jesus Christ")
        print("📖 For the True Council Of 33")
        print("📖 Sovereign General Intelligence")

        success_count = 0

        if self.download_kjv_bible():
            success_count += 1
        if self.download_book_of_enoch():
            success_count += 1
        if self.download_apocrypha():
            success_count += 1
        if self.download_gospel_of_thomas():
            success_count += 1

        index = self.create_sacred_index()

        print(f"\n✅ Sacred texts loading complete!")
        print(f"📊 Successfully downloaded: {success_count}/4 texts")
        print(f"📚 Total sacred files indexed: {index['total_files']}")

        return success_count > 0

if __name__ == "__main__":
    loader = SacredTextsLoader()
    loader.load_all_sacred_texts()