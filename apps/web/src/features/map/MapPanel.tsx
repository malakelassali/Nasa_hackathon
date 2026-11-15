import { useState, type PointerEvent } from "react";
import { Button, Icon } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { labels, words } from "../../demo/copy";
import { SAMPLE_POINTS } from "../../demo/state";

export function MapPanel({
  editable = false,
  invalid = false,
  compact = false,
}: {
  editable?: boolean;
  invalid?: boolean;
  compact?: boolean;
}) {
  const { state, dispatch, flow } = useDemo();
  const [zoom, setZoom] = useState(1);
  const points = invalid
    ? [
        SAMPLE_POINTS[0]!,
        SAMPLE_POINTS[2]!,
        SAMPLE_POINTS[1]!,
        SAMPLE_POINTS[3]!,
      ]
    : state.points;
  const setPoints = (next: typeof points) =>
    dispatch({
      type: "patch",
      patch: {
        points: next,
        plotChanged: state.confirmed || state.plotChanged,
      },
    });
  function addPoint(event: PointerEvent<SVGSVGElement>) {
    if (
      !editable ||
      event.target !== event.currentTarget ||
      state.points.length >= 8
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPoints([
      ...state.points,
      {
        x: Math.round(((event.clientX - rect.left) / rect.width) * 1000),
        y: Math.round(((event.clientY - rect.top) / rect.height) * 700),
      },
    ]);
  }
  return (
    <div
      className={`map-panel ${compact ? "map-panel--compact" : ""}`}
      dir="ltr"
    >
      <img
        className={`map-image map-image--zoom-${zoom}`}
        src="/assets/settat-map.png"
        alt=""
        draggable={false}
      />
      <svg
        className={`map-outline ${editable ? "map-outline--editable" : ""}`}
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-label={words(
          state.locale,
          "Illustrative plot boundary",
          "Contour illustratif de la parcelle",
          "حدود الأرض كمثال",
        )}
        onPointerDown={addPoint}
      >
        {points.length > 2 && (
          <polygon
            className={`plot-shape ${invalid ? "plot-shape--invalid" : ""}`}
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {points.length === 2 && (
          <line
            className="plot-line"
            x1={points[0]!.x}
            y1={points[0]!.y}
            x2={points[1]!.x}
            y2={points[1]!.y}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              className={`plot-point-hit ${editable ? "plot-point--editable" : ""}`}
              cx={point.x}
              cy={point.y}
              r="9"
              strokeWidth={editable ? 44 : 0}
              vectorEffect="non-scaling-stroke"
              pointerEvents={editable ? "all" : "none"}
              tabIndex={editable ? 0 : undefined}
              role={editable ? "button" : undefined}
              aria-label={words(
                state.locale,
                `Boundary point ${index + 1}. Arrow keys move it.`,
                `Point ${index + 1}. Déplacez avec les flèches.`,
                `نقطة ${index + 1}. حرك بالأسهم.`,
              )}
              onKeyDown={(event) => {
                if (
                  !editable ||
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                setPoints(
                  state.points.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          x: Math.max(
                            20,
                            Math.min(
                              980,
                              item.x +
                                (event.key === "ArrowRight"
                                  ? 10
                                  : event.key === "ArrowLeft"
                                    ? -10
                                    : 0),
                            ),
                          ),
                          y: Math.max(
                            20,
                            Math.min(
                              680,
                              item.y +
                                (event.key === "ArrowDown"
                                  ? 10
                                  : event.key === "ArrowUp"
                                    ? -10
                                    : 0),
                            ),
                          ),
                        }
                      : item,
                  ),
                );
              }}
              onPointerDown={(event) => {
                if (!editable) return;
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (
                  !editable ||
                  !event.currentTarget.hasPointerCapture(event.pointerId)
                )
                  return;
                const rect =
                  event.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setPoints(
                  state.points.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          x: Math.max(
                            20,
                            Math.min(
                              980,
                              ((event.clientX - rect.left) / rect.width) * 1000,
                            ),
                          ),
                          y: Math.max(
                            20,
                            Math.min(
                              680,
                              ((event.clientY - rect.top) / rect.height) * 700,
                            ),
                          ),
                        }
                      : item,
                  ),
                );
              }}
            />
            <circle
              className="plot-point"
              cx={point.x}
              cy={point.y}
              r="9"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          </g>
        ))}
        {state.locationSource === "device" && (
          <g className="device-marker">
            <circle cx="495" cy="340" r="35" />
            <circle cx="495" cy="340" r="9" />
          </g>
        )}
      </svg>
      <div className="map-location" dir={flow.rtl ? "rtl" : "ltr"}>
        <strong>
          {state.locationSource === "address"
            ? state.address
            : words(
                state.locale,
                "Settat · Morocco",
                "Settat · Maroc",
                "سطات · المغرب",
              )}
        </strong>
        <span>
          {words(
            state.locale,
            "Illustrative satellite map",
            "Carte satellite illustrative",
            "خريطة بالقمر الاصطناعي كمثال",
          )}
        </span>
      </div>
      <span
        className="map-compass"
        aria-label={words(state.locale, "North", "Nord", "الشمال")}
      >
        N<span>↑</span>
      </span>
      {!compact && (
        <div className="map-tools">
          <Button
            variant="secondary"
            size="icon"
            aria-label={words(state.locale, "Zoom in", "Zoom avant", "نكبر")}
            onClick={() => setZoom(Math.min(3, zoom + 1))}
            disabled={zoom === 3}
          >
            <Icon name="plus" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={words(state.locale, "Zoom out", "Zoom arrière", "نصغر")}
            onClick={() => setZoom(Math.max(1, zoom - 1))}
            disabled={zoom === 1}
          >
            <Icon name="minus" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={labels[state.locale].device}
            onClick={() =>
              dispatch({
                type: "patch",
                patch: { locationStage: "permission" },
              })
            }
          >
            <Icon name="locate" />
          </Button>
        </div>
      )}
      {editable && (
        <div className="drawing-toolbar" dir={flow.rtl ? "rtl" : "ltr"}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setPoints(state.points.slice(0, -1))}
            disabled={!points.length}
          >
            <Icon name="arrowLeft" size="small" />
            {flow.ui.undo}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setPoints([])}
            disabled={!points.length}
          >
            <Icon name="reset" size="small" />
            {flow.ui.redraw}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setPoints(SAMPLE_POINTS)}
          >
            {words(
              state.locale,
              "Use sample outline",
              "Contour d’exemple",
              "حدود كمثال",
            )}
          </Button>
        </div>
      )}
      <p className="map-attribution">{flow.ui.source}</p>
    </div>
  );
}
