def get_input(prompt: str, required: bool = True, default: str = None) -> str:
    while True:
        val = input(f"{prompt} {'(required)' if required else '(optional)'} [{default or ''}]: ").strip()
        if not val and default:
            return default
        if not val and required:
            print("This field is required.")
            continue
        return val

def get_list_input(item_name: str, fields_map: dict) -> list:
    items = []
    print(f"\n--- Adding {item_name} (Type 'done' for {list(fields_map.keys())[0]} to finish) ---")
    while True:
        first_key = list(fields_map.keys())[0]
        first_val = input(f"{item_name} {first_key}: ").strip()
        if first_val.lower() == 'done':
            break
        
        item = {first_key: first_val}
        for key, config in list(fields_map.items())[1:]:
            item[key] = get_input(f"{item_name} {key}", required=config.get('required', True))
            
            # Handle list fields (like details/bullets)
            if config.get('as_list'):
                bullets = []
                print(f"  Enter {key} lines (Type 'done' to finish {key})")
                while True:
                    bullet = input(f"    - ").strip()
                    if bullet.lower() == 'done':
                        break
                    if bullet:
                        bullets.append(bullet)
                item[key] = bullets

        items.append(item)
    return items
