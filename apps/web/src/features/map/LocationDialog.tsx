import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Modal } from "@agrix/ui";
import { useDemo } from "../../demo/DemoContext";
import { labels, words } from "../../demo/copy";

export function LocationDialog() {
  const { state, dispatch } = useDemo();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const text = labels[state.locale];
  const close = () =>
    dispatch({ type: "patch", patch: { locationStage: null } });
  const address = state.locationStage === "address";
  return (
    <Modal
      open={state.locationStage !== null}
      onClose={close}
      closeLabel={text.close}
      title={address ? text.address : text.location}
      description={text.permissions}
    >
      <div className="dialog-stack">
        <Badge tone="info">{text.preview}</Badge>
        {state.locationStage === "permission" && (
          <>
            <div className="permission-symbol">
              <Icon name="locate" size="large" />
            </div>
            <p>
              {words(
                state.locale,
                "Device location gets you close. You still choose and confirm the exact field boundary.",
                "Votre position vous rapproche de la parcelle. Vous choisissez toujours son contour exact.",
                "البلاصة ديالك كتقربك للأرض. الحدود خاصك تختارهم وتأكدهم بوحدك.",
              )}
            </p>
            <p className="muted">
              {words(
                state.locale,
                "No device location is accessed. Try the permission states below.",
                "Aucune position réelle n’est utilisée. Essayez les états ci-dessous.",
                "ما كنستعملو حتى موقع حقيقي. جرب حالات السماح لتحت.",
              )}
            </p>
            <Button
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: { locationStage: null, locationSource: "device" },
                })
              }
            >
              {text.allow}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({ type: "patch", patch: { locationStage: "blocked" } })
              }
            >
              {text.block}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: { locationStage: "unavailable" },
                })
              }
            >
              {words(
                state.locale,
                "Preview unavailable position",
                "Position indisponible",
                "نجرب موقع ما متوفرش",
              )}
            </Button>
          </>
        )}
        {(state.locationStage === "blocked" ||
          state.locationStage === "unavailable") && (
          <>
            <Card className="agrix-card--warning">
              <h3>
                {state.locationStage === "blocked"
                  ? words(
                      state.locale,
                      "Location permission declined",
                      "Position non autorisée",
                      "ما تسمحش بالموقع",
                    )
                  : words(
                      state.locale,
                      "We could not find a position",
                      "Position introuvable",
                      "ما لقيناش الموقع",
                    )}
              </h3>
              <p>
                {words(
                  state.locale,
                  "Your outline and draft are still here. Search an address or choose directly on the map.",
                  "Le contour et le brouillon sont conservés. Cherchez une adresse ou choisissez sur la carte.",
                  "الحدود والمسودة ديالك باقيين. قلب بالعنوان ولا اختار فالخريطة.",
                )}
              </p>
            </Card>
            <Button
              onClick={() => {
                setSearched(false);
                dispatch({
                  type: "patch",
                  patch: { locationStage: "address" },
                });
              }}
            >
              {text.address}
            </Button>
            <Button variant="secondary" onClick={close}>
              {words(
                state.locale,
                "Choose on the map",
                "Choisir sur la carte",
                "نختار فالخريطة",
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: { locationStage: "permission" },
                })
              }
            >
              {text.retry}
            </Button>
          </>
        )}
        {address && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearched(true);
            }}
            className="dialog-stack"
          >
            <Input
              label={text.address}
              maxLength={160}
              required
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearched(false);
              }}
              placeholder={words(
                state.locale,
                "Example: Settat",
                "Exemple : Settat",
                "مثلا: سطات",
              )}
            />
            <Button type="submit">
              <Icon name="search" />
              {text.search}
            </Button>
            {searched && (
              <Card className="agrix-card--sage">
                <h3>{query}</h3>
                <p>
                  {words(
                    state.locale,
                    "Sample result: Settat pilot. This preview does not search real addresses.",
                    "Résultat fictif : Settat. Aucune adresse réelle n’est recherchée.",
                    "نتيجة كمثال: سطات. هاد التجربة ما كتقلبش على عناوين حقيقية.",
                  )}
                </p>
                <Button
                  onClick={() =>
                    dispatch({
                      type: "patch",
                      patch: {
                        locationStage: null,
                        address: query.trim(),
                        locationSource: "address",
                      },
                    })
                  }
                >
                  {words(
                    state.locale,
                    "Center sample map here",
                    "Centrer la carte d’exemple",
                    "نقرب خريطة المثال لهنا",
                  )}
                </Button>
              </Card>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
