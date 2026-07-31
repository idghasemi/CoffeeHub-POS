from sqlalchemy.orm import Session

from models.category import Category

from repositories import category_repository


def get_categories(db: Session):

    return category_repository.get_all(db)


def get_category(db: Session, category_id: int):

    return category_repository.get_by_id(db, category_id)


def create_category(db: Session, data):

    category = Category(

        title=data.title,

        is_active=data.is_active

    )

    return category_repository.create(db, category)


def update_category(db: Session, category_id: int, data):

    category = category_repository.get_by_id(db, category_id)

    if not category:

        return None

    category.title = data.title

    category.is_active = data.is_active

    return category_repository.update(db, category)


def delete_category(db: Session, category_id: int):

    category = category_repository.get_by_id(db, category_id)

    if not category:

        return False

    category_repository.delete(db, category)

    return True