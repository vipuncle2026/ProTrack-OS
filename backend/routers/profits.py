"""利润汇总路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/profits", tags=["利润"])


@router.get("/summary")
def get_profit_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """按项目汇总利润：销售合同金额 - 采购合同金额 - 直接成本"""
    projects = db.query(models.Project).all()
    result = []

    for project in projects:
        # 销售合同总额
        sales_contracts = db.query(models.Contract).filter(
            models.Contract.project_id == project.id,
            models.Contract.contract_type == "sales",
        ).all()
        sales_amount = sum(c.amount or 0 for c in sales_contracts)

        # 采购合同总额
        purchase_contracts = db.query(models.Contract).filter(
            models.Contract.project_id == project.id,
            models.Contract.contract_type == "purchase",
        ).all()
        purchase_amount = sum(c.amount or 0 for c in purchase_contracts)

        # 直接成本
        direct_costs = db.query(models.DirectCost).filter(
            models.DirectCost.project_id == project.id,
        ).all()
        direct_cost_amount = sum(dc.amount or 0 for dc in direct_costs)

        profit = sales_amount - purchase_amount - direct_cost_amount
        margin = (profit / sales_amount * 100) if sales_amount > 0 else 0

        # 只返回有数据的项目，或 status 不是 terminated 的
        if sales_amount > 0 or purchase_amount > 0 or direct_cost_amount > 0:
            result.append({
                "projectId": project.id,
                "projectName": project.name,
                "projectStatus": project.status,
                "salesAmount": sales_amount,
                "purchaseAmount": purchase_amount,
                "directCostAmount": direct_cost_amount,
                "profit": profit,
                "margin": round(margin, 2),
                "salesContractCount": len(sales_contracts),
                "purchaseContractCount": len(purchase_contracts),
                "directCostCount": len(direct_costs),
            })

    # 按利润降序
    result.sort(key=lambda x: x["profit"], reverse=True)

    total_sales = sum(r["salesAmount"] for r in result)
    total_purchase = sum(r["purchaseAmount"] for r in result)
    total_direct = sum(r["directCostAmount"] for r in result)
    total_profit = total_sales - total_purchase - total_direct
    total_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0

    return {
        "items": result,
        "summary": {
            "totalSalesAmount": total_sales,
            "totalPurchaseAmount": total_purchase,
            "totalDirectCostAmount": total_direct,
            "totalProfit": total_profit,
            "totalMargin": round(total_margin, 2),
        },
    }
