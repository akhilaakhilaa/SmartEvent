"""Admin Provisioning & Credential Management CLI Tool for SmartEvent.

Usage:
    # 1. Reset password securely using interactive prompt (recommended):
    python backend/promote_admin.py --reset-password --email admin@smartevent.com
    python backend/promote_admin.py --reset-password --username admin

    # 2. Reset password non-interactively (with argument):
    python backend/promote_admin.py --reset-password --email admin@smartevent.com --password YourNewSecurePass123!

    # 3. Promote an existing user by email:
    python backend/promote_admin.py --email user@example.com

    # 4. Promote an existing user by username:
    python backend/promote_admin.py --username akhila

    # 5. Create a brand-new dedicated admin account:
    python backend/promote_admin.py --create --username admin2 --email admin2@smartevent.com

    # 6. List all current administrators:
    python backend/promote_admin.py --list
"""

import argparse
import getpass
import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.connection import SessionLocal
from app.models.user import User
from app.auth.security import hash_password

MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 100


def prompt_password(password_arg: str | None = None, confirm: bool = True) -> str | None:
    """Obtain and validate password via argument or secure getpass prompt."""
    if password_arg:
        pwd = password_arg
    else:
        try:
            pwd = getpass.getpass("Enter new password: ")
            if confirm:
                pwd_confirm = getpass.getpass("Confirm new password: ")
                if pwd != pwd_confirm:
                    print("[ERROR] Passwords do not match.")
                    return None
        except (KeyboardInterrupt, EOFError):
            print("\n[INFO] Password entry cancelled.")
            return None

    if len(pwd) < MIN_PASSWORD_LENGTH:
        print(f"[ERROR] Password must be at least {MIN_PASSWORD_LENGTH} characters long.")
        return None
    if len(pwd) > MAX_PASSWORD_LENGTH:
        print(f"[ERROR] Password cannot exceed {MAX_PASSWORD_LENGTH} characters.")
        return None

    return pwd


def list_admins():
    """List all users who currently hold the ADMIN role."""
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == "ADMIN").all()
        if not admins:
            print("[INFO] No users currently hold the ADMIN role.")
            return
        print(f"[INFO] Found {len(admins)} administrator(s):")
        for a in admins:
            print(f"  - ID: {a.id} | Username: {a.username} | Email: {a.email} | Role: {a.role}")
    finally:
        db.close()


def promote_user(email: str | None = None, username: str | None = None):
    """Promote an existing user to ADMIN without altering other attributes."""
    db = SessionLocal()
    try:
        query = db.query(User)
        if email:
            user = query.filter(User.email == email.strip().lower()).first()
            identifier = f"email '{email}'"
        elif username:
            user = query.filter(User.username == username.strip()).first()
            identifier = f"username '{username}'"
        else:
            print("[ERROR] Please provide either --email or --username to promote.")
            return False

        if not user:
            print(f"[ERROR] User with {identifier} was not found.")
            return False

        if user.role == "ADMIN":
            print(f"[INFO] User '{user.username}' (ID: {user.id}) is already an ADMIN.")
            return True

        old_role = user.role
        user.role = "ADMIN"
        db.commit()
        db.refresh(user)
        print(f"[SUCCESS] User '{user.username}' (ID: {user.id}) successfully promoted from {old_role} to ADMIN.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to promote user: {e}")
        return False
    finally:
        db.close()


def reset_password(email: str | None = None, username: str | None = None, password: str | None = None):
    """Reset the password for an existing user.
    
    Guarantees:
    - Never creates a new user.
    - Preserves ID, username, email, and role.
    - Validates minimum/maximum length.
    - Uses the project's native bcrypt hash_password function.
    - Rolls back on error and closes the DB session reliably.
    """
    if not email and not username:
        print("[ERROR] Please provide either --email or --username to identify the account.")
        return False

    db = SessionLocal()
    try:
        query = db.query(User)
        if email:
            user = query.filter(User.email == email.strip().lower()).first()
            identifier = f"email '{email}'"
        else:
            user = query.filter(User.username == username.strip()).first()
            identifier = f"username '{username}'"

        if not user:
            print(f"[ERROR] User with {identifier} was not found.")
            return False

        # Securely prompt for password if not provided as argument
        new_password = prompt_password(password, confirm=True if not password else False)
        if not new_password:
            return False

        # Update strictly the hashed_password column
        user.hashed_password = hash_password(new_password)
        db.commit()
        db.refresh(user)

        print(
            f"[SUCCESS] Password reset successfully for user ID {user.id} "
            f"('{user.username}', email: '{user.email}', role: {user.role})."
        )
        return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to reset password: {e}")
        return False
    finally:
        db.close()


def create_admin(username: str, email: str, password: str | None = None):
    """Create a brand-new administrator account."""
    if not username or not email:
        print("[ERROR] --username and --email are required to create an admin.")
        return False

    cleaned_username = username.strip()
    cleaned_email = email.strip().lower()

    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            (User.email == cleaned_email) | (User.username == cleaned_username)
        ).first()

        if existing:
            if existing.email == cleaned_email:
                print(f"[ERROR] User with email '{cleaned_email}' already exists (ID: {existing.id}, Role: {existing.role}).")
            else:
                print(f"[ERROR] User with username '{cleaned_username}' already exists (ID: {existing.id}, Role: {existing.role}).")
            return False

        new_password = prompt_password(password, confirm=True if not password else False)
        if not new_password:
            return False

        admin_user = User(
            username=cleaned_username,
            email=cleaned_email,
            hashed_password=hash_password(new_password),
            role="ADMIN",
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"[SUCCESS] New administrator created successfully! ID: {admin_user.id}, Username: '{admin_user.username}', Email: '{admin_user.email}'.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create admin: {e}")
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="SmartEvent Administrator Provisioning & Credential Tool")
    parser.add_argument("--list", action="store_true", help="List all current administrators")
    parser.add_argument("--email", type=str, help="Email of existing user to promote or reset password")
    parser.add_argument("--username", type=str, help="Username of existing user to promote, create, or reset password")
    parser.add_argument("--create", action="store_true", help="Create a brand-new administrator account")
    parser.add_argument("--reset-password", action="store_true", help="Reset password for an existing user")
    parser.add_argument("--password", type=str, help="Password for account (prompts securely via getpass if omitted)")

    args = parser.parse_args()

    if args.list:
        list_admins()
    elif args.reset_password:
        if not args.email and not args.username:
            print("[ERROR] When using --reset-password, provide --email or --username to identify the account.")
            sys.exit(1)
        success = reset_password(email=args.email, username=args.username, password=args.password)
        sys.exit(0 if success else 1)
    elif args.create:
        if not args.username or not args.email:
            print("[ERROR] When using --create, you must provide --username and --email.")
            sys.exit(1)
        success = create_admin(args.username, args.email, args.password)
        sys.exit(0 if success else 1)
    elif args.email or args.username:
        success = promote_user(email=args.email, username=args.username)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
