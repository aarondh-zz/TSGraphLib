import { Point, Rectangle, Vector } from "./math";
import { Layout } from "./animate";
import { IVertex, IEdge, Graph } from "./graph";

export class Body {
    public velocity: Vector;
    public acceleration: Vector;
    constructor(public position: Vector, public mass: number) {
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
    };

    public applyForce(force: Vector): void {
        this.acceleration = this.acceleration.add(force.divide(this.mass));
    };
}
export class Spring {
    constructor(public body1: Body, public body2: Body, public length: number, public k: number) {
    }
}

export interface Nearest<V> {
    vertex?: IVertex<V>
    position?: Point;
    distance?: number
}



export class ForceDirected<V, E> implements Layout<V, E> {
    private _points: { [key: string]: Body };
    private _springs: { [key: string]: Spring };
    constructor(
        public graph: Graph<V, E>,
        public stiffness: number,
        public repulsion: number,
        public damping: number,
        public minEnergyThreshold: number = 0.01,
        public maxSpeed: number = Infinity) {
        this._points = {};
        this._springs = {};
    }

    //return a spring for an edge
    private getSpring(edge: IEdge<E>): Spring {
        let spring = this._springs[edge.id];

        if (!spring) {
            var length = (edge.payload["length"] !== undefined) ? edge.payload["length"] : 1.0;
            spring = this._springs[edge.id] = new Spring(
                this.getBody(this.graph.getVertex(edge.fromId)),
                this.getBody(this.graph.getVertex(edge.toId)),
                length,
                this.stiffness
            );
        }
        return spring;
    }

    //return the body for a vertex

    public getBody(vertex: IVertex<V>): Body {
        var body = this._points[vertex.id];
        if (!body) {
            var mass = (vertex.payload["mass"] !== undefined) ? vertex.payload["mass"] : 1.0;
            body = this._points[vertex.id] = new Body(Vector.random(), mass);
        }

        return body;
    }

    private forEachVertexPoint(each: (vertex: IVertex<V>, body: Body) => void): void {
        this.graph.forEachVertex((vertex) => {
            each(vertex, this.getBody(vertex));
        });
    }

    private forEachEdgeSpring(each: (edge: IEdge<E>, spring: Spring) => void): void {
        this.graph.forEachEdge((edge) => {
            each(edge, this.getSpring(edge));
        });
    }
    private applyCoulombsLaw() {
        this.forEachVertexPoint((v1, body1)=> {
            this.forEachVertexPoint((v2, body2)=> {
                if (body1 !== body2) {
                    var d = body1.position.subtract(body2.position);
                    var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                    var direction = d.normalise();

                    // apply force to each end body
                    body1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
                    body2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
                }
            });
        });
    }
    private applyHookesLaw() {
        this.forEachEdgeSpring((edge, spring) => {
            var d = spring.body2.position.subtract(spring.body1.position); // the direction of the spring
            var displacement = spring.length - d.magnitude();
            var direction = d.normalise();

            // apply force to each end body
            spring.body1.applyForce(direction.multiply(spring.k * displacement * -0.5));
            spring.body2.applyForce(direction.multiply(spring.k * displacement * 0.5));
        });
    }
    private attractToCentre() {
        this.forEachVertexPoint((vertex, body)=> {
            var direction = body.position.multiply(-1.0);
            body.applyForce(direction.multiply(this.repulsion / 50.0));
        });
    }
    private updateVelocity(timestep: number) {
        this.forEachVertexPoint((vertex, body) => {
            body.velocity = body.velocity.add(body.acceleration.multiply(timestep)).multiply(this.damping);
            if (body.velocity.magnitude() > this.maxSpeed) {
                body.velocity = body.velocity.normalise().multiply(this.maxSpeed);
            }
            body.acceleration = new Vector(0, 0);
        });
    }
    private updatePosition(timestep: number) {
        this.forEachVertexPoint((vertex, body) => {
            body.position = body.position.add(body.velocity.multiply(timestep));
        });
    }
    private totalEnergy() {
        var energy = 0.0;
        this.forEachVertexPoint((vertex, body) => {
            var speed = body.velocity.magnitude();
            energy += 0.5 * body.mass * speed * speed;
        });

        return energy;
    }
    public tick(timestep: number) {
        this.applyCoulombsLaw();
        this.applyHookesLaw();
        this.attractToCentre();
        this.updateVelocity(timestep);
        this.updatePosition(timestep);
    }
    public isReady(): boolean {
        return this.totalEnergy() > this.minEnergyThreshold
    }
    public forEachVertex(each: (vertex: IVertex<V>, position: Vector) => void): void {
        this.forEachVertexPoint((vertex, body) => {
            each(vertex, body.position);
        });
    }

    public forEachEdge(each: (edge: IEdge<E>, p1: Vector, p2: Vector) => void): void {
        this.forEachEdgeSpring((edge, spring) => {
            each(edge, spring.body1.position, spring.body2.position);
        });
    }
    public nearest(position: { x: number, y: number }): Nearest<V> {
        var min: Nearest<V> = {}
        var t = this;
        this.forEachVertexPoint(function (vertex, body) {
            var distance = body.position.subtract(position as Vector).magnitude();

            if (min.distance === null || distance < min.distance) {
                min = { vertex: vertex, position: body.position, distance: distance };
            }
        });

        return min;
    }
    public getBoundingBox(): Rectangle {
        var bottomLeft = new Vector(-2, -2);
        var topRight = new Vector(2, 2);

        this.forEachVertexPoint((vector, body) => {
            if (body.position.x < bottomLeft.x) {
                bottomLeft.x = body.position.x;
            }
            if (body.position.y < bottomLeft.y) {
                bottomLeft.y = body.position.y;
            }
            if (body.position.x > topRight.x) {
                topRight.x = body.position.x;
            }
            if (body.position.y > topRight.y) {
                topRight.y = body.position.y;
            }
        });

        var padding = topRight.subtract(bottomLeft).multiply(0.07); // ~5% padding

        return { bottomLeft: bottomLeft.subtract(padding), topRight: topRight.add(padding) };
    }
}
