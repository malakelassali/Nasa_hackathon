from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field


class FarmContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    area_ha: float | None = Field(default=None, gt=0, le=100_000)
    previous_crop: str | None = Field(default=None, min_length=1, max_length=60)
    irrigation: Literal["rainfed", "limited", "available"] | None = None
    location: str | None = Field(default=None, min_length=1, max_length=100)
    soil: str | None = Field(default=None, min_length=1, max_length=100)
    budget_mad: float | None = Field(default=None, ge=0, le=10**9)


Operation = Literal[
    "get_farmer_profile", "get_farm_plots", "get_plot_crop_history",
    "get_local_climate_data", "get_soil_information", "get_crop_rotation_recommendations",
    "compare_rotation_strategies", "update_farmer_preferences", "add_farming_observation",
]


class FarmResult(BaseModel):
    source: Literal["retrieved", "estimate", "missing", "development_mock"]
    data: dict = Field(default_factory=dict)


class FarmTools(Protocol):
    def call(self, session_id: str, operation: Operation, context: FarmContext,
             observation: str | None = None) -> FarmResult: ...


class DevelopmentFarmTools:
    """Local examples with no measurements and no persistence."""

    def call(self, session_id, operation, context, observation=None):
        if operation in {"get_crop_rotation_recommendations", "compare_rotation_strategies"}:
            if context.previous_crop == "القمح":
                return FarmResult(source="development_mock", data={"example_crops": ["العدس", "الحمص"]})
        return FarmResult(source="missing")
