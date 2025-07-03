import os
import json
import hashlib
from typing import TypedDict, Dict
import time
import argparse
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed


def measure_time(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"Function '{func.__name__}' took {end - start:.2f} seconds")
        return result
    return wrapper


@dataclass
class InputConfig:
    local_directory: str
    local_json: str
    steamdb_json: str


class FileEntry(TypedDict):
    name: str
    sha1: str
    size: int


def sanitize_path(path: str):
    return path.replace("\\", "/")


def get_all_files(directory: str) -> list[str]:
    file_list = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            abs_path = os.path.join(root, file)
            abs_path = sanitize_path(abs_path)
            file_list.append(abs_path)
    return file_list


def compute_sha1(file_path: str) -> str:
    buffer_size = 1 * 1024 * 1024  # 1 MB
    sha1 = hashlib.sha1()
    with open(file_path, "rb") as f:
        while chunk := f.read(buffer_size):
            sha1.update(chunk)
    return sha1.hexdigest()


def compute_single_item(abs_path: str) -> FileEntry:
    return {
        "name": abs_path,
        "size": os.path.getsize(abs_path),
        "sha1": compute_sha1(abs_path),
    }


@measure_time
def compute_items_sync(files: list[str]) -> list[FileEntry]:
    items = []
    for file in files:
        item = compute_single_item(file)
        items.append(item)
    return items


@measure_time
def compute_items_concurrent(files: list[str]) -> list[FileEntry]:
    items = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = []
        for file in files:
            futures.append(executor.submit(compute_single_item, file))
        for future in as_completed(futures):
            item = future.result()
            items.append(item)

    return items


def compute_local_items(directory: str) -> list[FileEntry]:
    directory = sanitize_path(directory)
    files = get_all_files(directory)
    items = compute_items_sync(files)
    for item in items:
        item["name"] = item["name"].replace(directory, "")
    return items


def read_steamdb_items(path: str) -> list[FileEntry]:
    with open(path, "r") as f:
        items = json.load(f)
        items = list(filter(lambda item: len(item["sha1"]) > 0, items))
        return items


def compare_hash(local_hash: str, steamb_hash: str) -> bool:
    split = steamb_hash.split("***")
    prefix = split[0]
    suffix = split[1]
    return local_hash.startswith(prefix) and local_hash.endswith(suffix)


def create_dict(items: list[FileEntry]) -> Dict[str, FileEntry]:
    result = {}
    for item in items:
        key = item["name"]
        result[key] = item
    return result


def find_diff(local_items: list[FileEntry], steamdb_items: list[FileEntry]):
    local_dict = create_dict(local_items)
    steamdb_dict = create_dict(steamdb_items)

    added = []
    changed = []
    missing = []

    for item in local_items:
        name = item["name"]
        other = steamdb_dict.get(name)
        if (other is None):
            added.append(name)
        else:
            hash_equal = compare_hash(item["sha1"], other["sha1"])
            if (not hash_equal):
                changed.append(name)

    for item in steamdb_items:
        name = item["name"]
        other = local_dict.get(name)
        if (other is None):
            missing.append(name)

    return {
        "added": added,
        "changed": changed,
        "missing": missing
    }


def main():
    parser = argparse.ArgumentParser("script.py")
    parser.add_argument("-p", "--config_path", dest="config_path", help="[todo]", type=str)
    args = parser.parse_args()

    config_path: str = args.config_path
    config_dir = os.path.dirname(config_path)

    with open(config_path) as f:
        data = json.load(f)
        config = InputConfig(**data)

    print(config)

    if not os.path.isabs(config.local_directory):
        raise Exception("'local_directory' should be absolute path")

    if not os.path.isabs(config.local_json):
        config.local_json = os.path.join(config_dir, config.local_json)

    if not os.path.isabs(config.steamdb_json):
        config.steamdb_json = os.path.join(config_dir, config.steamdb_json)

    local_items = compute_local_items(config.local_directory)

    with open(config.local_json, "w") as f:
        json.dump(local_items, f, indent=2)

    steamdb_items = read_steamdb_items(config.steamdb_json)

    diff = find_diff(local_items, steamdb_items)

    output_path = os.path.join(os.getcwd(), "output.json")
    with open(output_path, "w") as f:
        json.dump(diff, f, indent=2)


if __name__ == "__main__":
    main()
