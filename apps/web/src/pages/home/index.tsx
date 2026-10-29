import { NavLink } from "react-router";

export function Home() {

  const MenuButton = ({ children, to }: { children: React.ReactNode, to: string }) => {

    return (
      <NavLink 
        className="border border-gray-300 h-100 cursor-pointer rounded-md font-bold text-lg uppercase text-center flex flex-col justify-center"
        to={to}
        end
      >
        {children}
      </NavLink>
    )
  }
  return (
    <div className="">
      <h1 className="text-xl font-light m-4">Registro de ventas</h1>
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        <MenuButton to="" >Registrar venta</MenuButton>
        <MenuButton to="" >Agregar stock</MenuButton>
        <MenuButton to="/movimientos" >Movimientos</MenuButton>
        <MenuButton to="" >Inventario</MenuButton>
      </div>
    </div>
  );
}

export default Home;


