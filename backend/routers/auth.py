from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import verify_password, hash_password, create_access_token, get_current_user
from utils import new_id

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": schemas.UserOut(
            id=user.id,
            username=user.username,
            email=user.email or "",
            fullName=user.full_name or "",
            role=user.role,
            departmentId=user.department_id or "",
            departmentName=user.department_name or "",
            avatar=user.avatar or "",
        ),
    }


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email or "",
        fullName=current_user.full_name or "",
        role=current_user.role,
        departmentId=current_user.department_id or "",
        departmentName=current_user.department_name or "",
        avatar=current_user.avatar or "",
    )


@router.post("/change-password")
def change_password(
    body: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="原密码错误")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="新密码不能少于6位")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "密码修改成功"}
