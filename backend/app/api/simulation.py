from fastapi import APIRouter
from app.schemas.simulation import SimulationParams, SimulationResult
from app.services.simulink_service import SimulinkService

router = APIRouter(prefix="/simulation", tags=["Simulink Rural Capacity Simulation"])

@router.post("/run", response_model=SimulationResult)
def run_rural_capacity_simulation(params: SimulationParams):
    """Section 22 of README: Simulink capacity and tele-ophthalmology throughput simulation"""
    return SimulinkService.simulate_rural_screening_flow(params)

@router.get("/defaults", response_model=SimulationParams)
def get_default_simulation_parameters():
    return SimulationParams()
