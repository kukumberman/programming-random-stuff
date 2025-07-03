```py
import hashlib
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Regular blocking hash function
def compute_sha1(file_path, buffer_size=65536):
    sha1 = hashlib.sha1()
    with open(file_path, 'rb') as f:
        while chunk := f.read(buffer_size):
            sha1.update(chunk)
    return file_path, sha1.hexdigest()

# Async wrapper to run in thread
async def async_compute_sha1(file_path, executor):
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(executor, compute_sha1, file_path)
    except Exception as e:
        print(f"Failed to hash {file_path}: {e}")
        return file_path, None

# Collect all file paths
def get_all_files(directory):
    return [file for file in Path(directory).rglob('*') if file.is_file()]

# Main async function
async def compute_all_hashes_async(directory, max_workers=8):
    files = get_all_files(directory)
    results = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        tasks = [async_compute_sha1(str(f), executor) for f in files]
        for future in asyncio.as_completed(tasks):
            file_path, sha1 = await future
            if sha1:
                results[file_path] = sha1
    return results

# Entry point
def run_async_hashing(directory):
    return asyncio.run(compute_all_hashes_async(directory))

# Example usage
if __name__ == '__main__':
    directory_path = '/absolute/path/to/your/directory'
    hash_results = run_async_hashing(directory_path)

    for path, sha1 in hash_results.items():
        print(f"{path} : {sha1}")
```
